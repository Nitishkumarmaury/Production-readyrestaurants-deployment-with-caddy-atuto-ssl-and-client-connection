import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { AdminDto, SignInDto } from './dto/admin.dto';
import { DbService } from 'src/db/db.service';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { AdminAggregation } from './admin.aggregation';
import { CommonService } from 'src/common/common.service';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import mongoose, { Types } from 'mongoose';
import * as dto from './dto/admin.dto';
import { ResponseMapper } from '../common/utils/response-mapper.util'; // Import
import { DecryptDataDto } from '../admin/dto/decrypt-data.dto';
import { UpdateSubAdminDto } from './dto/update-sub-admin.dto';
import { CreateSubAdminDto } from './dto/create-staff.dto';
import { StaffListDto } from './dto/staff-listing.dto';
import { AdminPanelPages, AdminStatus } from './schema/admin.schema';
import { languageData } from './schema/db-data';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { EarningType } from 'src/earning/schema/earning.schema';


@Injectable()
export class AdminService {
  constructor(
    private readonly model: DbService,
    private readonly jwtService: JwtService,
    private readonly adminAggregation: AdminAggregation,
    private readonly commonService: CommonService
  ) { }

  async login(signInDto: SignInDto , req : any) {
    try {
      let  fetch_admin : any = await this.model.admin.findOne({
        email: signInDto.email,
      }).lean();

      if (fetch_admin) {
        if (fetch_admin.is_active === false) {
          throw new HttpException(
            {
              error_code: 'Your account is deactivated.Please contact Admin',
              error_description:
                'Your account is deactivated.Please contact Admin',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!fetch_admin.superAdmin && !fetch_admin.globalAdmin && fetch_admin.status === AdminStatus.BLOCKED) {
          throw new HttpException(
            {
              error_code: 'ACCOUNT_BLOCKED',
              error_description: 'Your account is blocked. Please contact Admin',
            },
            HttpStatus.FORBIDDEN,
          );
        }
  
        

  

        const isPasswordValid = await bcrypt.compare(
          signInDto.password,
          fetch_admin.password,
        );
        if (isPasswordValid) {
          // const scope = fetch_admin.name === 'super admin' ? 'admin' : 'subadmin';
          let scope;
          if (fetch_admin.globalAdmin) {
            scope = 'globaladmin';
          }
          else if (fetch_admin.superAdmin) {
            scope = 'admin';
          }
          else {
            scope = 'subadmin';
          }
          const payload = { user_id: fetch_admin._id, scope };
          const access_token = await this.jwtService.signAsync(payload, {
            secret: 'HFDELIVERY',
          });

          const sessiondata = await this.model.session.create({
            user_id: fetch_admin._id,
            token: access_token,
            scope
          });


          fetch_admin.is_trial =  req?.owner?.is_trial || false;
          fetch_admin.trial_start_date = req?.owner?.trial_start_date || null;
          fetch_admin.trial_end_date = req?.owner?.trial_end_date || null;

          fetch_admin.currency = req?.owner?.currency || null;
          fetch_admin.currency_symbol = await this.commonService.getCurrencySymbol(req?.owner?.currency || null) || null;


          return {
            token: access_token,
            data: fetch_admin,
            modules_available : req?.modules_available || [],
            owner : req.owner
          };
        } else {
          throw new HttpException(
            {
              error_code: 'INCORRECT_PASSWORD',
              error_description: 'Incorrect password',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        throw new HttpException(
          {
            error_code: 'INVALID_EMAIL',
            error_description: 'email does not exist',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async UpdateTax(body, admin_id) {
    try {
      const currentDate = moment().format('DD/MM/YYYY'); // Date in DD/MM/YYYY format
      const currentTime = moment().format('hh:mm A'); // Time in 12-hour format with AM/PM

      const admin = await this.model.admin.findOne({ _id: admin_id });
      const currentTotalTaxPay = Number(admin.total_tax_pay);

      // Ensure that body.amount is a number
      const amountToAdd = Number(body.amount);

      // Calculate the new total amount
      const total_amount = currentTotalTaxPay + amountToAdd;
      const update = await this.model.admin.updateOne(
        { _id: admin_id },
        { total_tax_pay: total_amount },
      );
      const create = await this.model.tax.create({
        date: currentDate,
        time: currentTime,
        amount: body.amount,
        created_at: moment().add(5, 'hours').add(30, 'minutes'),
      });
      return { message: 'Tax update successfully' };
    } catch (error) {
      throw error;
    }
  }

  async TaxTransactionHistory(page, limit) {
    try {
      const skip = (page - 1) * limit;
      const data = await this.model.tax.find().skip(skip).limit(limit);
      const data_count = await this.model.tax.countDocuments()
      return {
        data_count: data_count,
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  async total_tax_amount(admin_id) {
    try {
      let total_tax_collected = 0;
      let total_tax_paid = 0;
      let PayTax = 0;
      // Fetch all bookings and calculate total tax collected
      const earnings = await this.model.earnings.find();
      for (const tax of earnings) {
        total_tax_collected += tax.tax;
      }

      // Fetch the admin details
      const pay_tax = await this.model.tax.find();

      for (const totaltax of pay_tax) {
        PayTax += parseFloat(totaltax.amount.toFixed(2));
      }

      // Calculate the total tax to be paid
      total_tax_paid = PayTax;
      const total_tax_to_be_paid = total_tax_collected - total_tax_paid;

      // Prepare the response
      return {
        total_tax_collected: total_tax_collected.toFixed(2),
        total_tax_paid: total_tax_paid.toFixed(2),
        total_tax_to_be_paid: total_tax_to_be_paid.toFixed(2),
      };
    } catch (error) {
      throw error;
    }
  }

// async BootStrapHomeCookedServices() {
//     const saveData = [
//       'Breakfast',
//       'Lunch',
//       'Dinner'
//     ];

//     const promises = saveData.map(async (name) => {
//       return this.model.HomeCookedServicesModel.findOneAndUpdate({
//         name: name
//       }, {
//         name: name
//       }, {
//         upsert: true,
//         new: true
//       });
//     });

//     await Promise.all(promises);
//   }

  
  async BootStrapAmenities() {
    const saveData = [
      'Parking',
      'Free Wifi',
      'RuPay Card Accepted',
      'Valet parking'
    ];

    const promises = saveData.map(async (name) => {
      return this.model.AmenitiesModel.findOneAndUpdate({
        name: name
      }, {
        name: name
      }, {
        upsert: true,
        new: true
      });
    });

    await Promise.all(promises);
  }


  async BootStrapServices() {
    const saveData = [
      'Buffet',
      'Pubs & bars',
      'Rooftop and outdoors',
      'Quick bites',
      'Pet friendly'
    ];

    const promises = saveData.map(async (name) => {
      return this.model.ServicesModel.findOneAndUpdate({
        name: name
      }, {
        name: name
      }, {
        upsert: true,
        new: true
      });
    });

    await Promise.all(promises);
  }


  async BootStrapLanguage() {

    let language = await this.model.language.countDocuments();
    if(language <= 0){

      const saveData = languageData;

      await this.model.language.insertMany(saveData);
      console.log('languages sync successfully!');
    }

  }


  async bootstrap_for_created_admin() {
    const email = 'admin@gmail.com';

    let fetch_data: any = await this.model.admin.findOne({ email: email });

    if (!fetch_data) {
      let default_password = 'Admin@#123';
      let password = await bcrypt.hash(default_password, 10);
      let saveData = {
        name: 'super admin',
        image: null,
        email: 'admin@gmail.com',
        password: password,
        roles: [],
        superAdmin: true,
        subAdmin: false,
      };
      let data = await this.model.admin.create(saveData);

    }
  }

  async bootstrap_for_created_global_admin() {   // to create global admin

    const email = 'globaladmin@gmail.com';

    let fetch_data: any = await this.model.admin.findOne({ email: email });

    if (!fetch_data) {
      let default_password = 'Global@#123';
      let password = await bcrypt.hash(default_password, 10);
      let saveData = {
        name: 'global admin',
        image: null,
        email: 'global_admin@gmail.com',
        password: password,
        roles: [],
        superAdmin: false,
        subAdmin: false,
        globalAdmin: true,
      };

      let data=await this.model.admin.create(saveData);
    }
    
  }

  async dashboard() {
    try {
    
      const [
          customer,
          driver,
          driverequest,
          driverDocsUpdate,
          restaurant,
          restaurantRequest,
          restaurantUpdate,
          order,
          category,
          earnings,
          coupon,
          tax,


          cloth_branch,
          grocery_branch,
          pharmacy_branch,
          electronics_branch,

          driver_product_earning,


      ] = await Promise.all([
          this.customerCount(),
          this.driverCount(),
          this.driverRequest(),
          this.driverDocsUpdate(),
          this.restaurantCount(RestaurantType.Restaurant),
          this.restaurantRequestCount(),
          this.restaurantUpdateCount(),
          this.orderCount(),
          this.category(),
          this.earnings(),
          this.coupon(),
          this.tax(),
          
          this.restaurantCount(RestaurantType.Cloth),
          this.restaurantCount(RestaurantType.Grocery),
          this.restaurantCount(RestaurantType.Pharmacy),
          this.restaurantCount(RestaurantType.Electronics),


          this.driverOrdersEarnings()

      ]);



      return {
        customer: customer,
        driver: driver,
        driverequest: driverequest,
        driverDocsUpdate: driverDocsUpdate,
        
        restaurant: restaurant,

        restaurantRequest: restaurantRequest,
        restaurantUpdate: restaurantUpdate,
        order: order,
        category: category,
        earnings: earnings,
        coupon: coupon,
        tax: tax,
        cloth_branch,
        grocery_branch,
        pharmacy_branch,
        electronics_branch,
        driver_product_earning 

      };
    } catch (error) {
      throw error;
    }
  }

  async customerCount() {
    try {
      // let today = moment.utc().startOf('day').valueOf();
      // let ThisWeek = moment.utc().startOf('week').valueOf();
      // let ThisMonth = moment.utc().startOf('month').valueOf();

      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayCustomer = await this.model.customer.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        is_phone_verify: true,
        is_email_verify: true,
        // created_at: { $gte: today },
        createdAt: { $gte: today },
      });

      let weekCustomer = await this.model.customer.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        is_phone_verify: true,
        is_email_verify: true,
        createdAt: { $gte: ThisWeek },
      });

      let monthCustomer = await this.model.customer.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        is_phone_verify: true,
        is_email_verify: true,
        createdAt: { $gte: ThisMonth },
      });

      let overallCustomer = await this.model.customer.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        is_phone_verify: true,
        is_email_verify: true,
      });
      return {
        todayCustomer: todayCustomer,
        weekCustomer: weekCustomer,
        monthCustomer: monthCustomer,
        overallCustomer: overallCustomer,
      };
    } catch (error) {
      throw error;
    }
  }

  async driverCount() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todaydriver = await this.model.driver.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        set_up_profile: true,
        is_approved: true,
        createdAt: { $gte: today },
      });

      let weekdriver = await this.model.driver.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        set_up_profile: true,
        is_approved: true,
        createdAt: { $gte: ThisWeek },
      });

      let monthdriver = await this.model.driver.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        set_up_profile: true,
        is_approved: true,
        createdAt: { $gte: ThisMonth },
      });

      let overalldriver = await this.model.driver.countDocuments({
        is_active: true,
        is_block: false,
        is_deleted: false,
        set_up_profile: true,
        is_approved: true,
      });
      return {
        todayDriver: todaydriver,
        weekDriver: weekdriver,
        monthDriver: monthdriver,
        overallDriver: overalldriver,
      };
    } catch (error) {
      throw error;
    }
  }

  async driverRequest() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todaydriverRequest = await this.model.driver.countDocuments({
        is_approved: null,
        approved_on: null,
        is_docs_update: false,
        set_up_profile: true,
        createdAt: { $gte: today },
      });

      let weekdriverRequest = await this.model.driver.countDocuments({
        is_approved: null,
        approved_on: null,
        is_docs_update: false,
        set_up_profile: true,
        createdAt: { $gte: ThisWeek },
      });

      let monthdriverRequest = await this.model.driver.countDocuments({
        is_approved: null,
        approved_on: null,
        is_docs_update: false,
        set_up_profile: true,
        createdAt: { $gte: ThisMonth },
      });

      let overalldriverRequest = await this.model.driver.countDocuments({
        is_approved: null,
        set_up_profile: true
      });
      return {
        todayDriverRequest: todaydriverRequest,
        weekDriverRequest: weekdriverRequest,
        monthDriverRequest: monthdriverRequest,
        overallDriverRequest: overalldriverRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  async driverDocsUpdate() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayDocsUpdate = await this.model.driver.countDocuments({
        is_approved: null,
        is_docs_update: true,
        set_up_profile: true,
        createdAt: { $gte: today },
      });

      let weekDocsUpdate = await this.model.driver.countDocuments({
        is_approved: null,
        is_docs_update: true,
        set_up_profile: true,
        createdAt: { $gte: ThisWeek },
      });

      let monthDocsUpdate = await this.model.driver.countDocuments({
        is_approved: null,
        is_docs_update: true,
        set_up_profile: true,
        createdAt: { $gte: ThisMonth },
      });

      let overallDocsUpdate = await this.model.driver.countDocuments({
        is_approved: null,
        is_docs_update: true,
        set_up_profile: true,
      });
      return {
        todayDocsUpdate: todayDocsUpdate,
        weekDocsUpdate: weekDocsUpdate,
        monthDocsUpdate: monthDocsUpdate,
        overallDocsUpdate: overallDocsUpdate,
      };
    } catch (error) {
      throw error;
    }
  }

  async restaurantCount(type) {
    try {
      


      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayRestaurant = await this.model.restaurant.countDocuments({
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        createdAt: { $gte: today },
        restaurant_type: type,
      });

      let weekRestaurant = await this.model.restaurant.countDocuments({
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        createdAt: { $gte: ThisWeek },
        restaurant_type: type,
      });

      let monthRestaurant = await this.model.restaurant.countDocuments({
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        createdAt: { $gte: ThisMonth },
        restaurant_type: type,
      });

      let overallRestaurant = await this.model.restaurant.countDocuments({
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        restaurant_type: type,
      });


      return {
        todayRestaurant: todayRestaurant,
        weekRestaurant: weekRestaurant,
        monthRestaurant: monthRestaurant,
        overallRestaurant: overallRestaurant,
      };
    } catch (error) {
      throw error;
    }
  }

  async restaurantRequestCount() {
    try {


      // const today = moment.utc().startOf('day').valueOf();
      // let ThisWeek = moment.utc().startOf('week').valueOf();
      // let ThisMonth = moment.utc().startOf('month').valueOf();

      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayRestaurantRequest = await this.model.restaurant.countDocuments({
        // verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,

        // is_restaurant_update: false,
        // is_submit_verification: true,
        updatedAt: { $gte: today },
      });

      let weekRestaurantRequest = await this.model.restaurant.countDocuments({
        // verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        updatedAt: { $gte: ThisWeek },
      });

      let monthRestaurantRequest = await this.model.restaurant.countDocuments({
        // verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        updatedAt: { $gte: ThisMonth },
      });

      let overallRestaurantRequest = await this.model.restaurant.countDocuments(
        {
          // verification: RestaurantVerificationStatus.SUBMITTED,
          is_deleted: false,
        },
      );
      return {
        todayRestaurantRequest: todayRestaurantRequest,
        weekRestaurantRequest: weekRestaurantRequest,
        monthRestaurantRequest: monthRestaurantRequest,
        overallRestaurantRequest: overallRestaurantRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  async restaurantUpdateCount() {
    try {

      // let today = moment.utc().startOf('day').valueOf();
      // let ThisWeek = moment.utc().startOf('week').valueOf();
      // let ThisMonth = moment.utc().startOf('month').valueOf();

      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayRestaurantUpdate = await this.model.restaurant.countDocuments({
        // doc_update_verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        // is_restaurant_update: true,
        updatedAt: { $gte: today },
      });

      let weekRestaurantUpdate = await this.model.restaurant.countDocuments({
        // doc_update_verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        // is_restaurant_update: true,
        updatedAt: { $gte: ThisWeek },
      });

      let monthRestaurantUpdate = await this.model.restaurant.countDocuments({
        // doc_update_verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        // is_restaurant_update: true,
        updatedAt: { $gte: ThisMonth },
      });

      let overallRestaurantUpdate = await this.model.restaurant.countDocuments({
        // doc_update_verification: RestaurantVerificationStatus.SUBMITTED,
        is_deleted: false,
        // is_restaurant_update: true,
      });
      return {
        todayRestaurantUpdate: todayRestaurantUpdate,
        weekRestaurantUpdate: weekRestaurantUpdate,
        monthRestaurantUpdate: monthRestaurantUpdate,
        overallRestaurantUpdate: overallRestaurantUpdate,
      };
    } catch (error) {
      throw error;
    }
  }

  async orderCount() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayorders = await this.model.order.countDocuments({
        createdAt: { $gte: today },
      });

      let weekorders = await this.model.order.countDocuments({
        createdAt: { $gte: ThisWeek },
      });

      let monthorders = await this.model.order.countDocuments({
        createdAt: { $gte: ThisMonth },
      });

      let overallorders = await this.model.order.countDocuments();
      return {
        todayorders: todayorders,
        weekorders: weekorders,
        monthorders: monthorders,
        overallorders: overallorders,
      };
    } catch (error) {
      throw error;
    }
  }

  async category() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todaycategory = await this.model.category.countDocuments({
        vendor_id: null,
        createdAt: { $gte: today },
      });

      let weekcategory = await this.model.category.countDocuments({
        vendor_id: null,
        createdAt: { $gte: ThisWeek },
      });

      let monthcategory = await this.model.category.countDocuments({
        vendor_id: null,
        createdAt: { $gte: ThisMonth },
      });

      let overallcategory = await this.model.category.countDocuments({
        vendor_id: null,
      });
      return {
        todaycategory: todaycategory,
        weekcategory: weekcategory,
        monthcategory: monthcategory,
        overallcategory: overallcategory,
      };
    } catch (error) {
      throw error;
    }
  }

  async coupon() {
    try {
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayCoupon = await this.model.coupon.countDocuments({
        vendor_id: null,
        createdAt: { $gte: today },
      });

      let weekCoupon = await this.model.coupon.countDocuments({
        vendor_id: null,
        createdAt: { $gte: ThisWeek },
      });

      let monthCoupon = await this.model.coupon.countDocuments({
        vendor_id: null,
        createdAt: { $gte: ThisMonth },
      });

      let overallCoupon = await this.model.coupon.countDocuments({
        vendor_id: null,
      });
      return {
        todayCoupon: todayCoupon,
        weekCoupon: weekCoupon,
        monthCoupon: monthCoupon,
        overallCoupon: overallCoupon,
      };
    } catch (error) {
      throw error;
    }
  }


  async tax() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthmili = startOfMonth.getTime();

      const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
      startOfYear.setHours(0, 0, 0, 0); // Set to the start of the day
      const startOfYearMili = startOfYear.getTime(); // Start of the year in milliseconds
      const todayMili = today.getTime(); // Current date and time in milliseconds



      let monthlyTax = 0;
      let yearlyTax = 0;
      let overallTax = 0;
      
      
      let monthBookings = await this.model.earnings.find({
        earning_type: { $nin: [EarningType.Pos] },
        createdAt: { $gte: startOfMonthmili },
      });
      let yearlyBookings = await this.model.earnings.find({
        earning_type: { $nin: [EarningType.Pos] },
        createdAt: { $gte: startOfYearMili, $lte: todayMili },
      });
      let overallBookings = await this.model.earnings.find({
        earning_type: { $nin: [EarningType.Pos] },
      });

      for (const monthly of monthBookings) {
        monthlyTax += monthly.tax;
      }

      for (const yearly of yearlyBookings) {
        yearlyTax += yearly.tax;
      }
      for (const overall of overallBookings) {
        overallTax += overall.tax;
      }

      return {
        montly_tax: parseFloat(monthlyTax.toFixed(2)),
        year_tax: parseFloat(yearlyTax.toFixed(2)),
        overall_tax: parseFloat(overallTax.toFixed(2)),
      }
    } catch (error) {
      throw error
    }
  }



  async earnings() {
    try {
      let todayEarnings = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      let overallEarnings = 0;
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayearnings = await this.model.earnings.find({
        createdAt: { $gte: today },
      });
      for (const earnings of todayearnings) {
        todayEarnings +=
          earnings.commission_from_driver + earnings.commission_from_restaurant - earnings?.coupon_amount || 0;
      }
      let weekearnings = await this.model.earnings.find({
        createdAt: { $gte: ThisWeek },
      });
      for (const earnings of weekearnings) {
        weekEarnings +=
          earnings.commission_from_driver + earnings.commission_from_restaurant  - earnings?.coupon_amount || 0 
      }
      let monthearnings = await this.model.earnings.find({
        createdAt: { $gte: ThisMonth },
      });
      for (const earnings of monthearnings) {
        monthEarnings +=
          earnings.commission_from_driver + earnings.commission_from_restaurant -earnings?.coupon_amount || 0 ;
      }
      let overallearnings = await this.model.earnings.find();

      for (const earnings of overallearnings) {
        overallEarnings +=
          earnings.commission_from_driver + earnings.commission_from_restaurant - earnings?.coupon_amount || 0;
      }
      return {
        todayearnings: todayEarnings,
        weekearnings: weekEarnings,
        monthearnings: monthEarnings,
        overallearnings: overallEarnings,
      };
    } catch (error) {
      throw error;
    }
  }


    async driverOrdersEarnings() {
    try {
      let todayEarnings = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      let overallEarnings = 0;
      let today = moment.utc().startOf('day').valueOf();
      let ThisWeek = moment.utc().startOf('week').valueOf();
      let ThisMonth = moment.utc().startOf('month').valueOf();

      let todayearnings = await this.model.earnings.find({
        driver_order_id : {$ne : null},
        createdAt: { $gte: today },
      });
      for (const earnings of todayearnings) {
        todayEarnings += earnings.total_amount;

      }
      let weekearnings = await this.model.earnings.find({
        driver_order_id : {$ne : null},
        createdAt: { $gte: ThisWeek },
      });
      for (const earnings of weekearnings) {
        weekEarnings += earnings.total_amount;
      }
      let monthearnings = await this.model.earnings.find({
        driver_order_id : {$ne : null},
        createdAt: { $gte: ThisMonth },
      });
      for (const earnings of monthearnings) {
        monthEarnings += earnings.total_amount;
      }


      let overallearnings = await this.model.earnings.find({
        driver_order_id : {$ne : null},
      });
      
      for (const earnings of overallearnings) {
        overallEarnings += earnings.total_amount;
      }
      return {
        todayearnings: todayEarnings,
        weekearnings: weekEarnings,
        monthearnings: monthEarnings,
        overallearnings: overallEarnings,
      };
    } catch (error) {
      throw error;
    }
  }




  async sent_notification(body) {
    try {

      // save clud notification 
      await this.model.CloudNotificationModel.create(body);

      if(body.type == dto.notificationType.Immediately){
        this.sendCloudNotification(body);
      }

      return { message: "Clude Notification added successfully" }
    } catch (error) {
      throw error;
    }
  }


  async sendCloudNotificationCron(){
  
    // for daily 
    let notifiations = await this.model.CloudNotificationModel.find({
      type : dto.notificationType.Daily
    });
    if(notifiations.length > 0){
      for(let key in notifiations) {

        let notification = notifiations[key];
        this.sendCloudNotification(notification);
      }
    }

    // for weekly
    let today = new Date();    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[today.getDay()];
    
    notifiations = await this.model.CloudNotificationModel.find({
      type : dto.notificationType.Weekly,
      weekly : {$in : [dayName]}
    });
    if(notifiations.length > 0){
      for(let key in notifiations) {
        let notification = notifiations[key];
        this.sendCloudNotification(notification);
      }
    }

    // for monthly
    let dayOfMonth = today.getDate();
    notifiations = await this.model.CloudNotificationModel.find({
      type : dto.notificationType.Monthly,
      monthly : {$in : [dayOfMonth]}
    });
    if(notifiations.length > 0){
      for(let key in notifiations) {
        let notification = notifiations[key];
        this.sendCloudNotification(notification);
      }
    }

    // for custom date 
    const yesterday = new Date(); 
    yesterday.setDate(yesterday.getDate() - 1); 
    notifiations = await this.model.CloudNotificationModel.find({
      type : dto.notificationType.CustomDate,
      custom_date : { $lte :  today, $gte : yesterday}

    });
    if(notifiations.length > 0){
      for(let key in notifiations) {
        let notification = notifiations[key];
        this.sendCloudNotification(notification);
      }
    }

  }

  async sendCloudNotification(body = null){
    try {

      let emails = [];
      let data_to_aggregate = [];
      //sent notification to all customer
      let data = null;

      if (body.send_notification_to === 'customer') {
        data_to_aggregate = [
          await this.adminAggregation.match(),
          await this.adminAggregation.SessionLookup(),
          await this.adminAggregation.project(),
        ];

        data = await this.model.customer.aggregate(data_to_aggregate);

      }
      //sent notification to selected customer
      else if (body.send_notification_to === 'selected_customer') {
        data_to_aggregate = [
          await this.adminAggregation.selectedmatch(body.selected_ids),
          await this.adminAggregation.SessionLookup(),
          await this.adminAggregation.project(),
        ];
        data = await this.model.customer.aggregate(data_to_aggregate);
      }
      //sent notification to all drivers
      else if (body.send_notification_to === 'driver') {
        data_to_aggregate = [
          await this.adminAggregation.drivermatch(),
          await this.adminAggregation.SessionLookup(),
          await this.adminAggregation.project(),
        ];
        data = await this.model.driver.aggregate(data_to_aggregate);
        if (body.send_notification_via === 'email') {
          await this.sent_email(data, body.title, body.description);
        } else {
          await this.sent_push(data, body.title, body.description);
        }
      }
      //sent notification to selected driver
      else if (body.send_notification_to === 'selected_driver') {
        data_to_aggregate = [
          await this.adminAggregation.selectedmatch(body.selected_ids),
          await this.adminAggregation.SessionLookup(),
          await this.adminAggregation.project(),
        ];
        data = await this.model.driver.aggregate(data_to_aggregate);
      }

      else if (body.send_notification_to === 'restaurant') {
        data_to_aggregate = [
          await this.adminAggregation.restaurantMatch(),
          await this.adminAggregation.vendorLookup(),
          await this.adminAggregation.UnwindvendorLookup(),
          await this.adminAggregation.RestaurantSessionLookup(),
          await this.adminAggregation.projectVendor(),
        ];
        data = await this.model.restaurant.aggregate(data_to_aggregate);

      }
      //sent notification to selected driver
      else if (body.send_notification_to === 'selected_restaurant') {
        data_to_aggregate = [
          await this.adminAggregation.selectedmatch(body.selected_ids),
          await this.adminAggregation.SessionLookup(),
          await this.adminAggregation.project(),
        ];
        data = await this.model.driver.aggregate(data_to_aggregate);
      }

      if (body.send_notification_via === 'email') {
        await this.sent_email(data, body.title, body.description);
      } else {
        await this.sent_push(data, body.title, body.description);
      }

    } catch (error) {
      throw error;
    }

  }

  
  async cloudNotification(dto : dto.CloudNotificationListDto){

    let {page, limit} = dto;
    let skip = (page -1) * limit;
    let total = await this.model.CloudNotificationModel.countDocuments();
     let data = await this.model.CloudNotificationModel.find().limit(limit).skip(skip);

     return { total: total, data : data};

  }


  async sent_email(data, title, description) {
    try {
      let file_path = path.join(
        __dirname,
        '../../dist/emails/cloud-notification.hbs',
      );

      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });

      // Compile the template

      const template = Handlebars.compile(html);
      const email_data = {
        description: description,
      };
      const htmlToSend = template(email_data);

      data.forEach(async (element) => {

        let mail_data = {
          to: element.email,
          subject: title,
          html: htmlToSend,
        };
        await this.commonService.sendmail(
          mail_data.to,
          mail_data.subject,
          null,
          mail_data.html,
        );
      });

    } catch (error) {
      throw error;
    }
  }

  async sent_push(data, title, description) {
    try {
      for (const customer of data) {
        if (customer?.sessions && customer?.sessions?.length > 0) {
          

        
          for (const fcm of customer?.sessions) {

            const fcm_token = fcm.fcm_token;

            let pushData = {
              title: title,
              description: description,
            };
            let data_push = {
              type: 'admin_push',
            };
            
            this.commonService.send_notification(pushData, fcm_token, data_push);


          }
          
        
        
        } else {
          console.warn(
            `Skipping customer ${customer.email} due to empty or missing sessions.`,
          );
        }
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }


  

  add_restro_quick_picks = async (req: any, body: dto.pick_restro) => {
    try {
      const { user_id } = req.payload;
      const { restaurant_ids } = body;
      const timestampMs = moment.utc().valueOf();

      if (!restaurant_ids || restaurant_ids.length === 0) {
        return { data: [], message: "No restaurant IDs provided" };
      }

      const restaurantObjectIds = restaurant_ids.map((id: string) => new Types.ObjectId(id));

      const restaurants = await this.model.restaurant.updateMany(
        { _id: { $in: restaurantObjectIds } },
        { is_quick_pick: true, quick_pick_time: timestampMs },
        { new: true }
      )

      return { data: restaurants };
    } catch (error) {
      throw error;
    }
  };

  get_quick_picks_admin_ = async (req: any, body: dto.pick_restro_list) => {
    try {
      const { page, limit } = body;
      const options = await this.commonService.set_options(page, limit);

      const query = {
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        is_quick_pick: true
      }
      const restaurants = await this.model.restaurant.find(query, {}, options).sort({
        quick_pick_time: -1
      });
      const count = await this.model.restaurant.countDocuments(query);
      return {
        data: restaurants,
        count: count
      }
    } catch (error) {
      throw error;
    }
  };

  get_quick_picks_admin = async (req: any, body: dto.pick_restro_list) => {
    try {
      let { page, limit } = body;

      page = Math.max(1, parseInt(page as any as string) || 1);
      limit = Math.max(1, parseInt(limit as any as string) || 10);
      const skip = (page - 1) * limit;

      const query = {
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        is_quick_pick: true,
        is_deleted: false
      };

      const [restaurants, count] = await Promise.all([
        this.model.restaurant.find(query).sort({ quick_pick_time: -1 }).skip(skip).limit(limit).select('_id restaurant_name image country_code restaurant_phone quick_pick_time address location'),
        this.model.restaurant.countDocuments(query)
      ]);

      return {
        data: restaurants,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      };
    } catch (error) {
      throw error;
    }
  };


  remove_quick_picks_admin = async (restaurant_id: string) => {
    try {
      const restaurants = await this.model.restaurant.updateOne(
        { _id: new Types.ObjectId(restaurant_id) },
        { is_quick_pick: false },
      );
      return restaurants
    } catch (error) {
      throw error;
    }
  };

  async decryptData(body: DecryptDataDto, payload, req) {
    const { type, id, field, password } = body;
    const subadmin = await this.model.admin.findOne({ _id: new Types.ObjectId(payload.user_id) });
    if (!subadmin) {
      throw new HttpException({
        error_code: 'admin_not_found',
        error_description: 'Admin user not found',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Use separate decryption password
    if (!subadmin.decrypt_password) {
      throw new HttpException({
        error_code: 'no_decrypt_password',
        error_description: 'Decryption password not set for this admin',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const isPasswordValid = await bcrypt.compare(password, subadmin.decrypt_password);
    if (!isPasswordValid) {
      throw new HttpException({
        error_code: 'unauthorized',
        error_description: 'Invalid decryption password',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Step 2: Fetch target user based on type
    let targetUser;

    switch (type) {
      case 'customer':
        targetUser = await this.model.customer.findOne({
          _id: new Types.ObjectId(id),
        });
        break;
      case 'vendor':
        targetUser = await this.model.vendor.findOne({
          _id: new Types.ObjectId(id),
        });
        break;
      case 'driver':
        targetUser = await this.model.driver.findOne({
          _id: new Types.ObjectId(id),
        });
        break;
      case 'restaurant':
        targetUser = await this.model.restaurant.findOne({
          _id: new Types.ObjectId(id),
        }).populate([{ path: 'vendor_id' }]);
        break;
      default:
        throw new HttpException({
          error_code: 'invalid_type',
          error_description: 'Invalid User type',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!targetUser) {
      throw new HttpException({
        error_code: 'user_not_found',
        error_description: 'User not found',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const restrictedFields = ['password', '__v'];
    if (restrictedFields.includes(field)) {
      throw new HttpException({
        error_code: 'blocked',
        error_description: `Access denied: field "${field}" is restricted`,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    let response: any = { field };
    if (['phone', 'restaurant_phone'].includes(field)) {
      response.value = (field === 'phone' || field === 'restaurant_phone')
        ? (targetUser.phone ?? targetUser.restaurant_phone)
        : targetUser[field];
      response.country_code = targetUser.country_code ?? null;
    } else {
      response.value = targetUser[field];
    }
    return response;
  }

  async createSubAdmin(dto: CreateSubAdminDto) {
    
    
    const existing = await this.model.admin.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    let hashedPassword = await bcrypt.hash(dto.password, 10);

    let data = {
      ...dto,
      password: hashedPassword,
      decrypt_password: dto.password,
      subAdmin: true,
      superAdmin: false,
      is_active: true,
    }

    return this.model.admin.create(data);


  }


  async updateSubAdmin(id: string, dto: UpdateSubAdminDto) {
    const staff = await this.model.admin.findOne({ _id: id, subAdmin: true });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (dto.email && dto.email !== staff.email) {
      const existing = await this.model.admin.findOne({ email: dto.email });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    dto['updated_at'] = Date.now();

    await this.model.admin.updateOne({ _id: id }, { $set: dto });
    return { message: 'Staff updated successfully' };
  }

  async deleteSubAdmin(id: string) {
    const staff = await this.model.admin.findOne({ _id: id, subAdmin: true });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    await this.model.admin.deleteOne({ _id: id });
    return { message: 'Staff deleted successfully' };
  }

  async getStaffList(query: StaffListDto) {
    const { page = 1, limit = 10, name } = query;

    const filters: any = {
      is_active: true,
      subAdmin: true
    }; // Assuming soft delete

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.admin
        .find(filters)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.model.admin.countDocuments(filters),
    ]);

    return {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      staffs: data,
    };
  }

  async getStaffDetail(id: string) {
    const staff = await this.model.admin.findOne({ _id: id, subAdmin: true });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }

  // Block or unblock staff
  async blockUnblockStaff(id: string, status: boolean) {
    const staff = await this.model.admin.findOne({ _id: id, subAdmin: true });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const updatePayload: any = {
      updated_at: new Date(),
      status: status ? AdminStatus.BLOCKED : AdminStatus.ACTIVE,
      is_active: !status, // Blocked = inactive, Unblocked = active
    };

    await this.model.admin.updateOne({ _id: id }, { $set: updatePayload });

    return {
      message: `Staff has been ${status ? 'blocked' : 'unblocked'} successfully`,
    };
  }

  async changePassword(dto:dto.ChangePasswordDto ,req: any){
    let user = null;


    let {currentPassword, newPassword} = dto;
    
    user = await this.model.admin.findById(req.payload.user_id);
    if (!user) {
      throw new NotFoundException('user not found');
    }


    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if(!isPasswordValid){
      throw new NotFoundException('please provide valid current password');
    }else {

      let hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      return await user.save();
    }

  }

  async rolesList(){




    let local = moment().format('YYYY-MM-DD HH:mm:ss');
    let utc = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    let America = moment.utc().tz("America/New_York").format('YYYY-MM-DD HH:mm:ss');


    let today = new Date(moment.utc().toISOString());


    console.log("local time ", local)
    console.log("utc time ", utc)
    console.log("America time ", America)



    let data = AdminPanelPages;
    return {data : data}
  }


  async topUsers(req: any, dto: dto.TopUsersDto) {


    let { type } = dto;
    let data = [];
    let pipeline = null;

      try {
          if (type == "driver") {
            pipeline = await this.adminAggregation.topDriversPipline();
            data = await this.model.driver.aggregate(pipeline);
          } else if (type == "restaurant") {
            pipeline = await this.adminAggregation.topRestaurantPipline();
            data = await this.model.restaurant.aggregate(pipeline);
          } else if (type == "customer") {

            pipeline = await this.adminAggregation.topCustomerPipline();
            data = await this.model.customer.aggregate(pipeline);
          }

          return { data: data }
      }catch (e) {
        console.log(e);
        throw e
      }

    }


  async dbClear(){
    await this.model.customer.deleteMany();
    await this.model.restaurant.deleteMany();
    await this.model.driver.deleteMany();
    await this.model.order.deleteMany();
    await this.model.walletModel.deleteMany();
    await this.model.loyaltyHistoryModel.deleteMany();
    await this.model.LoyaltyWalletModel.deleteMany();
    await this.model.NotificationModel.deleteMany();
    await this.model.payment.deleteMany();
    
    await this.model.earnings.deleteMany();

    await this.model.bank.deleteMany();
    await this.model.card.deleteMany();
    await this.model.cart.deleteMany();

    await this.model.favourite.deleteMany();
    await this.model.food.deleteMany();
    await this.model.groceryOrder.deleteMany();
  }


  async updateProfile(dto : dto.UpdateOwnerDto, req: any){
    let owner = req.owner;
    await this.commonService.updateTenantDetails(owner._id, dto)

    
    let admin = await this.model.admin.findOne({_id : req.payload.user_id});
    admin.name = (dto.full_name ) ? dto.full_name : admin.name ;
    admin.email = (dto.email ) ? dto.email : admin.email ;
    admin.image = (dto.profile_pic ) ? dto.profile_pic : admin.image ;    
    admin.save();
    return { message : "Profile update successfully"};
  }

}
