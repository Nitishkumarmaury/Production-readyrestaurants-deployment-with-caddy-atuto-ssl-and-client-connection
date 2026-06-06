import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AddBankDto, BankCountry, editBankDto } from './dto/bank.dto';
import { DbService } from 'src/db/db.service';

import { Types } from 'mongoose';
import * as moment from 'moment';
import { PaymentService } from 'src/payment/payment.service';
import { CommonService } from 'src/common/common.service';
import axios from 'axios';
import e from 'express';
import { RazorpayService } from 'src/razorpay/razorpay.service';
@Injectable()
export class BankService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly RazorpayService: RazorpayService,

    // @InjectStripe() private readonly stripe: Stripe,
  ) { }

  async addBank(body: AddBankDto, payload, req) {
    try {

      let { country} = body;
      let user;
      if (payload.scope === 'vendor') {
        user = await this.model.vendor.findById(payload.user_id);
        user.is_bank_added = true;
        
      } else {
        user = await this.model.driver.findById(payload.user_id);
      }

      if(!user){
        throw new HttpException(
          {
            error_code: 'user not found',
            error_description: 'user not found',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if(country == BankCountry.INDIA){

        if(user.razor_contact_id == null && user.razor_fund_account_id == null){

          let name = body.first_name+" "+body.last_name;
          
          let razorpayAccount  =  await this.RazorpayService.createAccountOnRazorPay(name, body.email, body.phone, body.ifsc, body.account_number);

          user.razor_contact_id = razorpayAccount.contact_id
          user.razor_fund_account_id = razorpayAccount.id
          user.country = BankCountry.INDIA;
          await user.save();
          return razorpayAccount;

        } else {
          throw new HttpException(
            {
              error_code: 'Bank account is already added',
              error_description: 'Bank account is already added',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

      }else {

        let file = await this.uploadDoc(body.file);
        // let file = await this.uploadDoc(body.file);


        let bank = await this.createBankToken(body, user.name);

        let account = await this.AddAccount(body, bank?.id, user, file?.id); // file_1OVDMwFfj22JfyvLVALrdvrO

        console.log("===??  ", account);

        let bankData: any = {
          created_at: moment.utc().valueOf(),
          country_code: body.country_code,
          phone: body.phone,
          address: body.address,
          country: body.country,
          first_name: body.first_name,
          last_name: body.last_name,
          currency: 'usd',
          customer: user?.stripe_customer_id,
          account_number: body.account_number,
          routing_number: body.routing_number,
          ssn_number: body.ssn_last4_number,
          date_of_birth: body.date_of_birth,
          account_id: account?.id,
          file: file.id,
          file_path: body?.file,
        };

        // Conditionally add `driver_id` or `vendor_id` based on `payload.scope`
        if (payload.scope === 'vendor') {
          bankData.vendor_id = user?._id;
        } else {
          bankData.driver_id = user?._id;
        }
        let data = await this.model.bank.create(bankData);

        payload.scope === 'vendor'
          ? await this.model.vendor.updateOne(
            { _id: user?._id },
            { is_bank_added: true },
          )
          : null;

        payload.scope === 'driver'
          ? await this.model.driver.updateOne(
            { _id: user?._id },
            { is_bank_added: true },
          )
          : null;

        user.country = country;
        await user.save();        
      }
      
      throw new HttpException(
        { message: 'Bank added successfully' },
        HttpStatus.OK,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async get_bank_detail(payload) {
    try {
      
      let data;
      let user = null;
      if (payload.scope === 'vendor') {
        user = await this.model.vendor.findById(payload.user_id);
      }else if(payload.scope === 'driver'){
        user = await this.model.driver.findById(payload.user_id);
      }

      if(user.country == BankCountry.INDIA){
        if(user && user.razor_fund_account_id){
          data = await this.RazorpayService.bankDetails(user.razor_fund_account_id);
        }
      }else {
        let filter = null;
        if (payload.scope === 'driver') {
          filter = { driver_id: payload.user_id };
        }else{
          filter = { vendor_id: payload.user_id };
        }
        data = await this.model.bank.findOne(filter);
      }
      return { data: data };    
    } catch (error) {
      throw error;
    }
  }

  async editBank(body: editBankDto, payload, req) {
    try {
      let update;
      let user;


      
      // let language = req.headers['language'] || 'english';
      // const key = 'Bank added successfully';
      // const localization = await this.commonService.localization(key);
      

      
      
      if (payload.scope === 'vendor') {
        user = await this.model.vendor.findById({
          _id: new Types.ObjectId(payload.user_id),
        });
      } else {
        user = await this.model.driver.findById({
          _id: new Types.ObjectId(payload.user_id),
        });
      }
      let bank = await this.createBankToken(body, user.name);
      let file = await this.uploadDoc(body.file);
      let account = await this.AddAccount(body, bank?.id, user, file?.id);
      let data = await this.model.bank.updateOne(
        { _id: body.bank_id },
        {
          updated_at_at: moment.utc().valueOf(),
          driver_id: user?._id,
          country_code: body.country_code,
          phone: body.phone,
          address: body.address,
          country: body.country,
          first_name: body.first_name,
          last_name: body.last_name,
          currency: 'usd',
          customer: user?.stripe_customer_id,
          account_number: body.account_number,
          routing_number: body.routing_number,
          ssn_number: body.ssn_last4_number,
          date_of_birth: body.date_of_birth,
          account_id: account?.id,
          file: file.id,
          file_path: body?.file,
        },
      );
      throw new HttpException(
        { message: 'Bank updated successfully' },
        HttpStatus.OK,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async uploadDoc(file) {
    try {

      let appConfig = await this.model.appConfiguration.findOne().lean();
      if(!appConfig || !appConfig.bucket){
        throw new Error('Bucket not found');
      }

      let stripeClient =await this.commonService.createStripeClient();
      file = `${appConfig.bucket.do_endpoint}/${appConfig.bucket.bucket_name}/${appConfig.bucket.folder}/${file}`;
      console.log('image url...', file);
      var buffer = await axios.get(file, { responseType: 'arraybuffer' });
      return await stripeClient.files.create({
        purpose: 'identity_document',
        file: {
          data: buffer?.data,
          name: file,
          type: 'application/octet-stream',
        },
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async createBankToken(body: AddBankDto, name: string) {
    try {
      let stripeClient =await this.commonService.createStripeClient();
      return await stripeClient.tokens.create({
        bank_account: {
          country: body.country,
          // currency: 'usd',
          currency: 'aud',
          account_holder_name: name,
          account_holder_type: 'individual',
          routing_number: body.routing_number,
          account_number: body.account_number,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async AddAccount(
    body: AddBankDto,
    bank_token_id: string,
    user: any,
    file_id,
  ) {
    try {


      
      let appConfig = await this.model.appConfiguration.findOne().lean();
      if(!appConfig || !appConfig.bucket){
        throw new Error('Bucket not found');
      }

      await this.uploadStripeDoc(
        `${appConfig.bucket.do_endpoint}/${appConfig.bucket.bucket_name}/${appConfig.bucket.folder}/${body.file}`,
      );

      console.log('body..............', body);
      
      let countryCode = body?.country_code || user?.country_code || '';
      let phone = body?.phone || user?.phone || '';

      if (!countryCode.startsWith('+')) {
        countryCode = `+${countryCode}`;
      }

      const rawPhone = `${countryCode}${phone}`;

      const formattedPhone = rawPhone.replace(/(?!^\+)\D/g, '');

      console.log('formattedPhone', formattedPhone);

      let payload1: any = {
        type: 'custom',
        country: body.country,
        email: user.email || user.temp_email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          // ssn_last_4: body.ssn_last4_number,
          address: {
            city: body?.address?.city || user?.address?.city,
            country: body?.country || user?.address?.country,
            postal_code:
              body?.address?.postal_code || user?.address?.postal_code,
            line1: body?.address?.line1 || user?.address?.line1,
            state: body?.address?.state || user?.address?.state,
          },
          email: user?.email,
          phone: formattedPhone,
          first_name: body.first_name || user?.name,
          last_name: body.last_name,
          dob: {
            day: moment(body?.date_of_birth || user?.date_of_birth).format(
              'DD',
            ),
            month: moment(body?.date_of_birth || user?.date_of_birth).format(
              'MM',
            ),
            year: moment(body?.date_of_birth || user?.date_of_birth).format(
              'YYYY',
            ),
          },
          verification: {
            document: {
              front: file_id || 'file_1OVDMwFfj22JfyvLVALrdvrO',
            },
          },
        },
        metadata: {
          customer_id: user?.customer_id,
        },
        business_profile: {
          url: 'https://staging.nearmerv.com',
          name: `${body?.first_name}`,
          support_email: user?.email || user?.temp_email,
          mcc: '5734',
        },
        company: {
          name: `${user.name}`,
          tax_id: '00000000000',
        },
        external_account: bank_token_id,
        tos_acceptance: {
          date: Math.floor(moment.utc().valueOf() / 1000),
          ip: '192.168.1.41',
        },
      };

      let stripeClient =await this.commonService.createStripeClient();
      return await stripeClient.accounts.create(payload1);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async uploadStripeDoc(file_url: any) {
    var buffer = await axios.get(file_url, { responseType: 'arraybuffer' });
    let stripeClient =await this.commonService.createStripeClient();

    var file = await stripeClient.files.create({
      purpose: 'identity_document',
      file: {
        data: buffer.data,
        name: file_url,
        type: 'application/octet-stream',
      },
    });
    return file;
  }
}
