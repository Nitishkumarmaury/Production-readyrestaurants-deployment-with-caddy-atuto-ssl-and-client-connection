import { Injectable } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { ConfiguratonDto, ConfiguratonType, UpdateConfigurationDto, UpdateConfigurationDtoPartial } from './dto/update-configuration.dto';
import { DbService } from 'src/db/db.service';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ConfigurationService {
  
  constructor(
    public readonly model: DbService,
    public readonly RazorpayService: RazorpayService,
    public readonly com: CommonService,
    
  ) { }

  async findAll(dto: ConfiguratonDto, req : any) {

    let userAgent = req?.headers['user-agent'] ?? null;
    const isDartClient = userAgent?.includes('Dart');

    let {type} = dto;

    
    let data : any = null;
    
    let currency = req?.owner?.currency || null;
    let currency_symbol = await this.com.getCurrencySymbol(req?.owner?.currency || null) || null;

    
    
    if(type !== undefined && type === ConfiguratonType.Payment){
      data  = await this.model.appConfiguration.findOne().select("paymentGateway razorpay stripe wallet loyalty loyalty_minimun_order amount_per_loyalty").lean();
      data.currency = currency;
      data.currency_symbol = currency_symbol;
    }else if(type !== undefined && type === ConfiguratonType.UiSettings){
      data = await this.model.appConfiguration.findOne().select("ui_settings").lean();
      data.currency = currency;
      data.currency_symbol = currency_symbol;
    }else if(type !== undefined && type === ConfiguratonType.ThirdPartyCredentials){
      data = await this.model.appConfiguration.findOne().select("bucket firebase_keys google_map_key_backend google_map_key_mobile google_map_key smtp_creds").lean();
      data.currency = currency;
      data.currency_symbol = currency_symbol;
    }else {
      data = await this.model.appConfiguration.find().lean();
      data[0].order_taking_range = Number(data[0].order_taking_range / 1000)
      data[0].show_restaurant_range = Number(data[0].show_restaurant_range / 1000)
      data[0].currency = currency;
      data[0].currency_symbol = currency_symbol;
    }

    let response =  {
      data: data, 
      modules_available : req?.modules_available || [],
    };


    console.log("=========>>>> ", isDartClient);

    if (isDartClient){
      return response;
    }else {
      return  await this.com.encryptPayload(response);
    }



    // return  await this.com.decryptPayload(ff.data)

    // return {
    //   data: data, 
    //   modules_available : req?.modules_available || [],
    // };
  }

  async update(updateConfigurationDto: UpdateConfigurationDtoPartial) {
    try {
      const updatePayload: any = { ...updateConfigurationDto };

      
      if(process.env.PAYMENT_KEY_UPDATE != "true"){
        delete updatePayload.stripe;
        delete updatePayload.razorpay;
      }
      const serviceArea = updateConfigurationDto.service_area;

      if (
        serviceArea &&
        typeof serviceArea.lat === 'number' &&
        typeof serviceArea.lng === 'number' &&
        !isNaN(serviceArea.lat) &&
        !isNaN(serviceArea.lng)
      ) {
        updatePayload.location = {
          type: 'Point',
          coordinates: [serviceArea.lng, serviceArea.lat], // [lng, lat]
        };
      } else {

        delete updatePayload.location;
      }

      if (updateConfigurationDto.driver_charges) {
        const charges = updateConfigurationDto.driver_charges;

        updatePayload.driver_charges = {
          cloth_charge: charges.cloth_charge ?? null,
          bag_charge: charges.bag_charge ?? null,
        };
      }

      // if (updateConfigurationDto.driver_charge_set_by == 'admin') { // for charges set by admin add if they want
      //   // make a function which run and set the delivery charges according to appconfif
      //   console.log("charges set by admin")
      // }
      // else if (updateConfigurationDto.driver_charge_set_by == 'vendor') {
      //   // in key set boolean false if charges can add by admin
      //   console.log("charges set by vendor")
      // }



      // Safely handle order_taking_range
      if (updateConfigurationDto.order_taking_range !== undefined) {
        const value = Number(updateConfigurationDto.order_taking_range);
        if (!isNaN(value)) {
          updatePayload.order_taking_range = value * 1000;
        } else {
          delete updatePayload.order_taking_range;
        }
      }

      // Safely handle show_restaurant_range
      if (updateConfigurationDto.show_restaurant_range !== undefined) {
        const value = Number(updateConfigurationDto.show_restaurant_range);
        if (!isNaN(value)) {
          updatePayload.show_restaurant_range = value * 1000;
        } else {
          delete updatePayload.show_restaurant_range;
        }
      }

      if (updateConfigurationDto.customer_edit_profile) {
        updatePayload.customer_edit_profile =
          updateConfigurationDto.customer_edit_profile;
      }

      let configuration = await this.model.appConfiguration.findOne();
      const update = await this.model.appConfiguration.updateOne(
        { _id: configuration._id },
        { $set: updatePayload },
      );


      if(updateConfigurationDto.razorpay !== undefined && updateConfigurationDto.razorpay){
        await this.RazorpayService.loadPaymentConfig();
      }

      if(updateConfigurationDto.bucket !== undefined && updateConfigurationDto.bucket){
        await this.model.configBucketDetails();
      }

      if(!updateConfigurationDto.is_fixed_time_delivery ){
        await this.model.driver.updateMany(
          {},
          { $set: { currently_send_ride_request: false } }
        );
      }

      return { message: 'Configuration successfully updated' };
    } catch (error) {
      console.log('update configuration error', error);
      throw error;
    }
  }


  // async setChargesByAdmin() {  // function to set delivery charges by admin..... for charges 

  //   const restaurant = await this.model.restaurant.find({});

  //   if (!restaurant || restaurant.length < 1) {
  //     return "No restaurant found";
  //   }
  //   const configDetail = await this.model.appConfiguration.find();
  //   const driverCharges = configDetail[0].base_fee;
    


  //   for (let rest of restaurant) {
  //     await this.model.restaurant.updateOne(
  //       { _id: rest._id },
  //       { $set: { delivery_price_per_km: driverCharges } }
  //     );
  //   }
  // }

  async bootstrap_configuration() {



    let fetch_data: any = await this.model.appConfiguration.find();
    if (fetch_data.length < 1) {
      
      const saveData = {
        location: { type: 'Point', coordinates: [ 0, 0 ] },
        commission_for_restaurant_by: 'percentage',
        lat: null,
        lng: null,
        location_name: null,
        cities: [],
        product_name: 'Ready Restaurant',
        support: {
          email: '',
          call: '',
          skype: ''
        },
        social_links: { facebook_url: '', instagram_url: '', youtube_url: '' },
        base_fee: 10,
        distance_per_km: 5,
        commission_percentage_for_driver: 15,
        commission_percentage_for_restaurant: 15,
        tax: { tax_keyword: 'Tax', tax_percentage: '10' },
        email_creds: { AppEmail: '', AppPassword: '' },
        app_commission: 10,
        order_taking_range: 99000,
        show_restaurant_range: 99000,
        paymentGateway: 'razorpay',
        razorpay: {
          key: '',
          secret: '',
          bank_account: ''
        },
        referral: { number_of_persons: 2, number_of_orders: 2, amount: 500 },
        stripe: {
          key: '',
          secret: '',
          webhook: ''
        },
        loyalty: true,
        wallet: true,
        amount_per_loyalty: 20,
        loyalty_minimun_order: 200,
        catering_commission : 5
      }

      
      await this.model.appConfiguration.create(saveData);
    }
  }

  async getConfiguration() {
    return await this.model.appConfiguration.findOne().lean();
  }
}
