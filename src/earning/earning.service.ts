import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { DbService } from 'src/db/db.service';
import { EarningsAggregation } from './earning.aggregation';
import * as fs from 'fs';
import * as path from 'path';
import { CommonService } from 'src/common/common.service';
import * as Handlebars from 'handlebars';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';
import mongoose from 'mongoose';
import * as puppeteer from 'puppeteer';
import { AppService } from 'src/app.service';
import { log } from 'console';
import { BankCountry } from 'src/bank/dto/bank.dto';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { EarningType } from './schema/earning.schema';

@Injectable()
export class EarningService {
  constructor(
    private readonly model: DbService,
    private readonly earningAggregation: EarningsAggregation,
    private readonly commonService: CommonService,
    private readonly appService: AppService,
    private readonly RazorpayService: RazorpayService

  ) { }
  async findAll(body) {
    try {

      const page = parseInt(body.page) || 1;
      const limit = parseInt(body.limit) || 10;
      const skip = (page - 1) * limit;

      const start_of_day = moment.utc().startOf('day').valueOf();
      console.log('start_of_day', start_of_day)

      let query = {};
      if (body.status === 'today') {
        query = {
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: start_of_day },
        };
      } else if (body.status === 'week') {
        query = {
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: moment.utc().startOf('week').valueOf() },
        };
      } else if (body.status === 'month') {
        query = {
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: moment.utc().startOf('month').valueOf() },
        };
      }
      let data_to_aggregate = [
        await this.earningAggregation.match(query),
        await this.earningAggregation.orderLookup(),
        await this.earningAggregation.orderUnwind(),

        await this.earningAggregation.project(),
        await this.earningAggregation.face_set(skip, limit),
      ];
      let data = await this.model.earnings.aggregate(data_to_aggregate);
      return {
        count: data[0]?.count[0]?.count,
        total_earning: Number(data[0]?.total_earning[0]?.total_earning.toFixed(2)),
        data: data[0]?.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async driverEarnings(body, driver) {
    try {
      let total_delivery_charge = 0;
      let total_delivery_commission = 0;
      let to_be_paid = 0
      const page = parseInt(body.page) || 1;
      const limit = parseInt(body.limit) || 10;
      const skip = (page - 1) * limit;

      const earnings: any = await this.model.earnings
        .find({
          driver_id: driver._id,
        })
        .skip(skip)
        .limit(limit);
      if (body.status === 'total') {
        for (const driver_earnings of earnings) {
          total_delivery_charge += driver_earnings.driver_earning;
          total_delivery_commission += driver_earnings.commission_from_driver;
        }
        to_be_paid = total_delivery_charge - total_delivery_commission
        let data = {
          total_delivery_charge: total_delivery_charge.toFixed(2),
          total_delivery_commission: total_delivery_commission.toFixed(2),
          amount_to_be_paid: to_be_paid.toFixed(2)
        }
        return {
          data: data
        };
      } else if (body.status === 'weekly') {
        const weeklyData = {};
        for (let data of earnings) {
          // Calculate the week starting from Sunday
          // const createdAt = new Date(data.created_at);
          const createdAt = data.createdAt;
          const dayOfWeek = createdAt.getDay();
          const startOfWeek = new Date(createdAt);
          startOfWeek.setDate(createdAt.getDate() - dayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          const weekKey = `${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`;
          console.log('weekkey............', weekKey);

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              total_delivery_charge: 0,
              total_delivery_commission: 0,
            };
          }

          weeklyData[weekKey].total_delivery_charge += data.driver_earning;
          weeklyData[weekKey].total_delivery_commission +=
            data.commission_from_driver;
        }

        const formattedData = [];
        for (let weekKey in weeklyData) {
          const [startOfWeek, endOfWeek] = weekKey.split(' to ');
          const weekData = weeklyData[weekKey];
          const startOfWeekDate = new Date(startOfWeek);
          const endOfWeekDate = new Date(endOfWeek);
          to_be_paid = weekData.total_delivery_charge - parseFloat(
            weekData.total_delivery_commission.toFixed(2))
          formattedData.push({
            week_start: startOfWeekDate.getTime(),
            week_end: endOfWeekDate.getTime(),
            total_delivery_charge: weekData.total_delivery_charge.toFixed(2),
            total_delivery_commission: parseFloat(
              weekData.total_delivery_commission.toFixed(2),
            ),
            amount_to_be_paid: to_be_paid.toFixed(2)
          });
        }

        return { weeklyData: formattedData };
      }
    } catch (error) {
      throw error;
    }
  }

  async moneyTransfer() {
    try {
      console.log('Starting moneyTransfer...');
      await this.earningTransferToDriver();
      await this.earningTransferToVendor();
      console.log('moneyTransfer completed successfully.');
    } catch (error) {
      console.error('Error during moneyTransfer:', error.message, error.stack);
      throw error;
    }
  }

  async earningTransferToDriver() {
    try {
      console.log('Starting earningTransferToDriver...');
      let total_delivery_charge = 0;
      let total_commision_from_driver = 0;
      let total_payout_amount = 0;

      let StartOfday = moment.utc().startOf('day').valueOf();
      const earnings = await this.model.earnings.find({
        pay_to_driver: 'pending',
        // created_at: { $lt: StartOfday },
      });

      console.log(`Found ${earnings.length} pending driver earnings`);

      for (const earning of earnings) {
        const { driver_id } = earning;
        // console.log(`Processing driver: ${driver_id}`);

        const driver = await this.model.driver.findOne({ _id: driver_id });
        if (!driver) {
          // console.warn(`Driver not found: ${driver_id}`);
          continue;
        }

        let check_bank_is_added = null;
        if(driver.country == BankCountry.INDIA){

          if(driver.razor_contact_id == null || driver.razor_fund_account_id == null){
              console.warn(`No bank account found for driver: ${driver_id}`);
              continue;
          }

        }else {
          
          check_bank_is_added = await this.model.bank.findOne({ driver_id });
          if (!check_bank_is_added) {
            // console.warn(`No bank account found for driver: ${driver_id}`);
            continue;
          }

        }
        
        console.log("driver payout ==>>", driver._id);

        let driverEarnings = await this.model.earnings.find({
          driver_id,
          pay_to_driver: 'pending',
          // created_at: { $lt: StartOfday },
        }).populate("order_id").lean();

        if (!driverEarnings.length) {
          console.log(`No pending earnings found for driver: ${driver_id}`);
          continue;
        }

        const earning_ids = driverEarnings.map((e) => e._id);
        total_delivery_charge = 0;
        total_commision_from_driver = 0;

        for (const e of driverEarnings) {
          total_delivery_charge += e.delivery_charge;
          total_commision_from_driver += e.commission_from_driver;
        }

        total_payout_amount = total_delivery_charge - total_commision_from_driver;

        let transfer_amount_to_driver = null;
        if(driver.country == BankCountry.INDIA){
            transfer_amount_to_driver = await this.RazorpayService.createPayout(driver.razor_fund_account_id, total_payout_amount)
        }else {

          transfer_amount_to_driver = await this.transferMoneyToUser(
          total_payout_amount,
          check_bank_is_added.account_id,
          );
        }

        // Week boundaries
        const payout_week_start = moment().subtract(1, 'week').startOf('week').toDate();
        const payout_week_end = moment().subtract(1, 'week').endOf('week').toDate();

        if (transfer_amount_to_driver) {
          // handle invoice 
          const invoice_url: any = await this.driverInvoice(driver, driverEarnings, total_payout_amount);
          console.log(`Money transferred successfully to driver: ${driver_id}`);
          await this.sent_payout_email_to_driver(
            driver,
            total_delivery_charge,
            total_commision_from_driver,
            total_payout_amount,
            invoice_url.downloadUrl
          );

          await this.model.earnings.updateMany(
            { _id: { $in: earning_ids }, driver_id },
            { pay_to_driver: 'complete' },
          );

          try {
            //Save payout log
            let fund_account_id = null;
            let transaction_ref = null;
            let payment_by = null;

            if(driver.country == BankCountry.INDIA){
                fund_account_id = transfer_amount_to_driver.fund_account_id;
                transaction_ref = transfer_amount_to_driver.id;
                payment_by =  PaymentGateway.RAZORPAY;
            } else {              
                transaction_ref = transfer_amount_to_driver?.id || null;
                payment_by =  PaymentGateway.STRIPE;
            }

            const res = await this.model.PayoutModel.create({
              type: 'driver',
              driver_id: driver._id,
              amount: total_payout_amount,
              delivery_charge: total_delivery_charge,
              commission: total_commision_from_driver,
              fund_account_id : fund_account_id,
              bank_account_id : check_bank_is_added?._id ?? null,
              transaction_ref: transaction_ref,
              payment_by : payment_by,
              status: 'success',
              failure_reason: null,
              payout_week_start,
              payout_week_end,
              invoice_url: invoice_url.downloadUrl,
            });

            console.log(res, '---------------------------')
          } catch (error) {
            console.log(error)
          }

        } else {
          // Save failed log
          await this.model.PayoutModel.create({
            type: 'driver',
            driver_id: driver._id,
            amount: total_payout_amount,
            delivery_charge: total_delivery_charge,
            commission: total_commision_from_driver,
            bank_account_id: check_bank_is_added._id,
            transaction_ref: null,
            status: 'failed',
            failure_reason: 'Money transfer API returned false',
            payout_week_start,
            payout_week_end,
            invoice_url: null,
          });
          console.error(`Failed to transfer money to driver: ${driver_id}`);
        }
      }
    } catch (error) {
      console.error('Error in earningTransferToDriver:', error.message, error.stack);
      throw error;
    }
  }


  async driverInvoice(driver, driverEarnings, total_payout) {
    if (!driver) {
      return "driver not found!";
    }

    let pdf;
    let browser;
    try {
      const invoiceData = {
        driver: driver.toObject(),
        driverEarnings,
        total_payout,
      };

      const file_path = path.join(__dirname, '../../dist/emails/driver-invoice.hbs');
      const html = fs.readFileSync(file_path, { encoding: 'utf-8' });

      Handlebars.registerHelper('formatPrice', function (price) {
        return parseFloat(price).toFixed(2);
      });

      const template = Handlebars.compile(html);
      const renderedHtml = template(invoiceData);

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      const pdfFileName = `Invoice_${driver._id}.pdf`;
      pdf = await this.appService.uploadInvoice(pdfFileName, pdfUint8Array);

      if (browser) {
        await browser.close();
      }

      return { downloadUrl: pdf.Location };

    } catch (error) {
      console.error('Error generating PDF:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  // async driverInvoice(driver, driverEarnings, total_payout) {
  //   if (driver) {

  //     let pdf;
  //     try {
  //       const invoiceData = {
  //         driver: driver.toObject(),
  //         driverEarnings: driverEarnings,
  //         total_payout: total_payout
  //       };

  //       let file_path = path.join(__dirname, '../../dist/emails/driver-invoice.hbs');
  //       let html = fs.readFileSync(file_path, { encoding: 'utf-8' });


  //       Handlebars.registerHelper('formatPrice', function (price) {
  //         // Use toFixed(2) to format the number to two decimal places
  //         return parseFloat(price).toFixed(2);
  //       });
  //       const template = Handlebars.compile(html);

  //       const renderedHtml = template(invoiceData);
  //       // return renderedHtml;

  //       var browser = await puppeteer.launch({
  //         headless: true,
  //         args: ['--no-sandbox'],
  //       });
  //       const page = await browser.newPage();
  //       await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

  //       const pdfUint8Array = await page.pdf({
  //         format: 'A4',
  //         printBackground: true,
  //       });

  //       const pdfFileName = `Invoice_${driver._id}.pdf`;
  //       pdf = await this.appService.uploadInvoice(pdfFileName, pdfUint8Array);
  //       if (browser) {
  //         await browser.close();
  //       }

  //       // send invoice on driver email 
  //       let template_file_path = path.join(
  //         __dirname,
  //         '../../dist/emails/driver-invoice-email.hbs',
  //       );
  //       let templatehtml = fs.readFileSync(template_file_path, { encoding: 'utf-8' });
  //       const template1 = Handlebars.compile(templatehtml);
  //       const data = {
  //         driverName: driver?.name || 'driver',
  //         invoiceLink: pdf.Location
  //       };
  //       const htmlToSend = template1(data);

  //       let mailData = {
  //         to: driver.email,
  //         subject: `Driver Payout Invoice`,
  //         html: htmlToSend,
  //       };
  //       this.commonService.sendmail(
  //         mailData.to,
  //         mailData.subject,
  //         null,
  //         mailData.html,
  //       );

  //       return { downloadUrl: pdf.Location }

  //     } catch (error) {
  //       console.error('Error generating PDF:', error);
  //       if (browser) {
  //         await browser.close();
  //       }
  //       throw error;
  //     }
  //   } else {
  //     return "driver not found!"
  //   }
  // }

  async earningTransferToDriver_old() {
    try {
      let total_delivery_charge = 0;
      let total_commision_from_driver = 0;
      let total_payout_amount = 0;
      let uniqueDriverIds = new Set();
      let StartOfday = moment.utc().startOf('day').valueOf();
      let earnings = await this.model.earnings.find({
        pay_to_driver: 'pending',
        // created_at: { $lt: StartOfday },
      });
      if (earnings) {
        for (const driver of earnings) {
          // const driver_id = driver.driver_id.toString(); // Convert ObjectId to string
          const driver_id = String(driver.driver_id); // Convert ObjectId to string
          uniqueDriverIds.add(driver_id);
        }
        for (const driverId of uniqueDriverIds) {
          const driver = await this.model.driver.findOne({ _id: driverId });
          const check_bank_is_added = await this.model.bank.findOne({
            driver_id: driverId,
          });
          if (check_bank_is_added) {
            let earnings: any = await this.model.earnings.find({
              driver_id: driverId,
              pay_to_driver: 'pending',
              // created_at: { $lt: StartOfday },
            });
            for (const earning of earnings) {
              total_delivery_charge += earning.delivery_charge;
              total_commision_from_driver += earning.commission_from_driver;
              total_payout_amount =
                total_delivery_charge - total_commision_from_driver;
            }
            let transfer_amount_to_driver = await this.transferMoneyToUser(
              total_payout_amount,
              // 100,
              check_bank_is_added.account_id,
            );
            let invoicelink = ''
            if (transfer_amount_to_driver) {
              await this.sent_payout_email_to_driver(
                driver,
                total_delivery_charge,
                total_commision_from_driver,
                total_payout_amount,
                invoicelink
              );
              await this.model.earnings.updateMany(
                { driver_id: driverId },
                { pay_to_driver: 'complete' },
              );
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }


  async earningTransferToVendor() {
    try {

      let StartOfday = moment.utc().startOf('day').valueOf();
      const earnings = await this.model.earnings.find({
        pay_to_vendor: 'pending',
        // created_at: { $lt: StartOfday },
        created_at: { $lte: Date.now() }
      });

      const uniqueRestaurantIds = new Set<string>();
      for (const earning of earnings) {
        uniqueRestaurantIds.add(earning.restaurant_id.toString());
      }


      for (const restaurant_id of uniqueRestaurantIds) {
        try {

          let total_food_amount = 0;
          let total_commision_from_vendor = 0;
          let total_payout_amount = 0;
          let total_restaurant_earning = 0;


          // const restaurant = await this.model.restaurant.findOne({ _id: restaurant_id }).populate("vendor_id");
          const restaurant = await this.model.restaurant.findOne({ _id: restaurant_id , restaurant_type : "restaurant"}).populate("vendor_id");
          if (!restaurant) {
            continue;
          }

          let vendor :any  = restaurant.vendor_id;
          let check_bank_is_added = null;
          if(vendor.country == BankCountry.INDIA){
            if(vendor.razor_contact_id == null || vendor.razor_fund_account_id == null){
              console.warn(`No bank account found for vendor: ${vendor._id}`);
              continue;              
            }
          }else {
            check_bank_is_added = await this.model.bank.findOne({
              vendor_id: restaurant.vendor_id,
            });

            if (!check_bank_is_added) {
              console.warn(`No bank account found for vendor: ${vendor._id}`);
              continue;
            }

          }
          

          let restaurantEarnings = await this.model.earnings.find({
            restaurant_id,
            pay_to_vendor: 'pending',
            //created_at: { $lt: StartOfday },
            created_at: { $lte: Date.now() }
          }).populate("order_id").lean();

          if (!restaurantEarnings.length) {
            console.log(`No pending earnings for restaurant: ${restaurant_id}`);
            continue;
          }

          for (const e of restaurantEarnings) {

            total_restaurant_earning += e?.restaurant_earning?? 0;

            // if(e?.food_amount > 0){
            //   total_food_amount += e?.food_amount?? 0;
            //   total_commision_from_vendor += e?.commission_from_restaurant?? 0;
            // }else {
            // }

          }

          // total_payout_amount = total_food_amount - total_commision_from_vendor + total_restaurant_earning;
          total_payout_amount = total_restaurant_earning;
          
          
          console.log(" total_payout_amount ===", total_payout_amount);
          
          
          let transfer_amount_to_user = null;

          if(vendor.country == BankCountry.INDIA){
            transfer_amount_to_user = await this.RazorpayService.createPayout(vendor.razor_fund_account_id, total_payout_amount)
          }else {
            transfer_amount_to_user = await this.transferMoneyToUser(
              total_payout_amount,
              check_bank_is_added.account_id,
            );
          }

          // Week boundaries
          const payout_week_start = moment().subtract(1, 'week').startOf('week').toDate();
          const payout_week_end = moment().subtract(1, 'week').endOf('week').toDate();

          if (transfer_amount_to_user) {
  

            let invoice_link = await this.vendorInvoice(restaurant, restaurantEarnings, total_payout_amount);
            console.log(`Money transferred successfully to vendor: ${invoice_link}`);

            // break;
            // return true;

            await this.sent_payout_email_to_vendor(
              restaurant,
              total_food_amount,
              total_commision_from_vendor,
              total_payout_amount,
              invoice_link
            );

            await this.model.earnings.updateMany(
              { restaurant_id, pay_to_vendor: 'pending' },
              { pay_to_vendor: 'complete' },
            );

            let fund_account_id = null;
            let transaction_ref = null;
            let payment_by = null;

            if(vendor.country == BankCountry.INDIA){
                fund_account_id = transfer_amount_to_user.fund_account_id;
                transaction_ref = transfer_amount_to_user.id;
                payment_by =  PaymentGateway.RAZORPAY;
            } else {              
                transaction_ref = transfer_amount_to_user?.id || null;
                payment_by =  PaymentGateway.STRIPE;
            }

            try {
              //Save payout log
              const res = await this.model.PayoutModel.create({
                type: 'restaurant',
                amount: total_payout_amount,
                restaurant_id: restaurant_id,
                food_amount: total_food_amount,
                commission: total_commision_from_vendor,
                fund_account_id : fund_account_id,
                bank_account_id : check_bank_is_added?._id ?? null,

                transaction_ref: transaction_ref,
                payment_by : payment_by,

                status: 'success',
                failure_reason: null,
                payout_week_start,
                payout_week_end,
                invoice_url: invoice_link,

              });
              console.log(res, '---------------------------')
            } catch (error) {
              console.log(error)
            }

          } else {
            console.error(`Failed to transfer money to vendor: ${restaurant.vendor_id}`);

            // Save failed log
            await this.model.PayoutModel.create({
              type: 'restaurant',
              amount: total_payout_amount,
              restaurant_id: restaurant_id,
              food_amount: total_food_amount,
              commission: total_commision_from_vendor,
              bank_account_id: check_bank_is_added?._id ?? "",
              transaction_ref: null,
              status: 'failed',
              failure_reason: 'Money transfer API returned false',
              payout_week_start,
              payout_week_end,
              invoice_url: null,
            });
            console.error(`Failed to transfer money to vendor: ${restaurant_id}`);

          }



        } catch (vendorError) {
          console.error(`Error processing vendor ${restaurant_id}:`, vendorError.message, vendorError.stack);
          continue;
        }





      }




    } catch (error) {
      console.error('Fatal error in earningTransferToVendor:', error.message, error.stack);
      throw error;
    }
  }

  async vendorInvoice(restaurant, restaurantEarnings, total_payout_amount) {

    console.log(" ===>>>> restaurantEarnings" , restaurantEarnings)

    try {
      const vendor: any = restaurant.vendor_id;
      const invoiceData = {
        restaurant: restaurant.toObject(),
        vendor: vendor.toObject(),
        restaurantEarnings: restaurantEarnings,
        total_payout: total_payout_amount
      };

      let file_path = path.join(__dirname, '../../dist/emails/vendor-invoice.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      Handlebars.registerHelper('formatPrice', function (price) {
        // Use toFixed(2) to format the number to two decimal places

        if(!price){
          return '0';
        }

        return  "$" + parseFloat(price).toFixed(2);
      });
      
      Handlebars.registerHelper('uppercase', function (value) {
        if (!value) return '';
        
        if(value == "current"){ 
            return "ORDER";
        }else if(value == "slot_booking"){
            return "DINEOUT";
        }
        
        return value.toUpperCase();
      });
      
      
      const template = Handlebars.compile(html);

      const renderedHtml = template(invoiceData);
      // return renderedHtml;

      var browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      const pdfFileName = `Invoice_${restaurant._id}.pdf`;
      let pdf = await this.appService.uploadInvoice(pdfFileName, pdfUint8Array);
      if (browser) {
        await browser.close();
      }

      return pdf.Location;
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }



  }


  async transferMoneyToUser(amount, destination) {
    try {
      //console.log('Account Id: ', destination, "==>", amount)
      let amountInCents = Math.round(amount * 100);

      let stripeClient =await this.commonService.createStripeClient();

      const account = await stripeClient.accounts.retrieve(destination);
      //console.log(account.capabilities);

      const accounts = await stripeClient.accounts.update(destination, {
        capabilities: {
          transfers: { requested: true },
        },
      });
      // console.log('accounts', accounts)

      let createPayout = await stripeClient.transfers.create({
        amount: amountInCents,
        currency: 'aud',
        destination: destination,
        // transfer_group: 'CAB_95',
        transfer_group: 'ReadyDeliveries',
      });
      if (createPayout) {
        //console.log(createPayout, 'payout succeed');
        return createPayout;
      }
      //console.log(createPayout, 'payout succeed');
      return false;
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  async sent_payout_email_to_driver(
    driver,
    total_delivery_charge,
    total_commision_from_driver,
    total_payout_amount,
    invoiceLink
  ) {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - 1);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const deposite_date = new Date(today);
      deposite_date.setDate(today.getDate() + 6);

      //newly added according to scope
      const weekStart = moment().subtract(1, 'week').startOf('week').toDate();
      const weekEnd = moment().subtract(1, 'week').endOf('week').toDate();

      const formattedStartDate = moment(weekStart).format('DD-MM-YYYY');
      const formattedEndDate = moment(weekEnd).format('DD-MM-YYYY');
      const formattedDepositeDate = moment(deposite_date).format('DD-MM-YYYY');
      let file_path = path.join(__dirname, '../../dist/emails/driver_payout.hbs');
      console.log('hello1');
      console.log('file_path', file_path);
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });

      // Compile the template
      const template = Handlebars.compile(html);

      // Create the data object
      const data = {
        driverName: driver?.name ? driver?.name : "",
        weekStart: formattedStartDate,
        weekEnd: formattedEndDate,
        totalDeliveryCharge: total_delivery_charge,
        totalCommission: total_commision_from_driver,
        netPayout: total_payout_amount,
        invoiceLink: invoiceLink
      };

      // Generate the HTML with the data
      const htmlToSend = template(data);

      console.log('hello2');
      const mailData = {
        to: driver.email,
        subject: `Your Weekly Payout Summary: ${formattedStartDate} to ${formattedEndDate}`,
        html: htmlToSend,
      };

      // Send an email with the response
      const mail = await this.commonService.sendmail(
        mailData.to,
        mailData.subject,
        null,
        mailData.html,
      );
    } catch (error) {
      console.log('error', error)
      // throw error;
    }
  }

  async sent_payout_email_to_vendor(
    restaurant,
    total_food_amount,
    total_commision_from_vendor,
    total_payout_amount,
    invoice_link
  ) {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - 1);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const deposite_date = new Date(today);
      deposite_date.setDate(today.getDate() + 6);
      const formattedStartDate = moment(startDate).format('DD-MM-YYYY');
      const formattedEndDate = moment(endDate).format('DD-MM-YYYY');
      const formattedDepositeDate = moment(deposite_date).format('DD-MM-YYYY');
      let file_path = path.join(__dirname, '../../dist/emails/vendor_payout.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });

      // Compile the template
      const template = Handlebars.compile(html);

      // Create the data object
      const data = {
        restaurantName: restaurant.name,
        weekStart: formattedStartDate,
        weekEnd: formattedEndDate,
        totalFoodAmount: total_food_amount,
        totalCommission: total_commision_from_vendor,
        netPayout: total_payout_amount,
        invoiceLink: invoice_link
      };

      // Generate the HTML with the data
      const htmlToSend = template(data);

      console.log('hello2');
      const mailData = {
        to: restaurant.vendor_id.email,
        subject: `Your Weekly Payout Summary: ${formattedStartDate} to ${formattedEndDate}`,
        html: htmlToSend,
      };

      // Send an email with the response
      const mail = await this.commonService.sendmail(
        mailData.to,
        mailData.subject,
        null,
        mailData.html,
      );
    } catch (error) {
      throw error;
    }
  }

  async adminEarnings(body) {
    try {
      const page = parseInt(body.page) || 1;
      const limit = parseInt(body.limit) || 10;
      const skip = (page - 1) * limit;
      let {type} = body;

      if(type == undefined || type == null || type == ""){
        type = "order"
      }

      const startOfDayUTC = moment.utc().startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      console.log('startOfDayUTC', startOfDayUTC)

      const startOfDay = moment.utc().startOf('day').valueOf();

      console.log('startOfDay>>>>>>>>>>>>>>', startOfDay)

      const startDate = moment.utc().startOf('day').toDate();
      const startOfWeek_ = moment.utc().startOf('week').toDate();

      console.log('startOfDay>##########>', startDate)
      console.log('startOfWeek_>##########>', startOfWeek_)


      const startOfWeek = moment.utc().startOf('week').valueOf();
      const startOfMonth = moment.utc().startOf('month').valueOf();
      const startOfYear = moment.utc().startOf('year').valueOf();

      let query  : any = {};

      let data_to_aggregate = [];

      if(type == "order"){

        switch (body.status) {
          case 'today':
            query = { order_placed_at: { $gte: startOfDay } };
            break;
          case 'week':
            query = { createdAt: { $gte: startOfWeek_ } };
            break;
          case 'month':
            query = { created_at: { $gte: startOfMonth } };
            break;
          case 'year':
            query = { created_at: { $gte: startOfYear } };
            break;
          case 'custom':
            query = { created_at: { $gte: parseInt(body.start_date), $lte: parseInt(body.end_date) } };
            break;
          default:
            query = {};
        }


        query.earning_type = { $nin: ["pos", EarningType.Pos, EarningType.Deal, EarningType.SlotBooking] };


        data_to_aggregate = [
          await this.earningAggregation.EarningMatch(query),
          await this.earningAggregation.earningProject(),
          await this.earningAggregation.orderLookup(),
          await this.earningAggregation.orderUnwind(),
          // await this.earningAggregation.deliverOrderMatch(),
          await this.earningAggregation.Earningface_set(skip, limit),

        ];
      }else if (type == "driver-order"){


        switch (body.status) {
        case 'today':
          query = { created_at: { $gte: startOfDay } };
          break;
        case 'week':
          query = { createdAt: { $gte: startOfWeek_ } };
          break;
        case 'month':
          query = { created_at: { $gte: startOfMonth } };
          break;
        case 'year':
          query = { created_at: { $gte: startOfYear } };
          break;
        case 'custom':
          query = { created_at: { $gte: parseInt(body.start_date), $lte: parseInt(body.end_date) } };
          break;
        default:
          query = {};
      }

      query.driver_order_id = { $ne: null };
     
        data_to_aggregate = [
          await this.earningAggregation.EarningMatch(query),
          await this.earningAggregation.driverOrderLookup(),
          await this.earningAggregation.driverOrderUnwind(),

          await this.earningAggregation.DriverOrderEarningface_set(skip, limit),
        ];


      }

      console.log('JSON.stringify(data_to_aggregate)', JSON.stringify(data_to_aggregate))
      let data = await this.model.earnings.aggregate(data_to_aggregate);

      

      return {
        count: data[0]?.count[0]?.count,
        total_earning: data[0]?.total_earning[0]?.total_earning,
        data: data[0]?.data,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async export_earning(body) {
    try {

      const startOfDay = moment.utc().startOf('day').valueOf();
      const startOfWeek = moment.utc().startOf('week').valueOf();
      const startOfMonth = moment.utc().startOf('month').valueOf();
      const startOfYear = moment.utc().startOf('year').valueOf();

      let query = {};

      switch (body.status) {
        case 'today':
          query = { created_at: { $gte: startOfDay } };
          break;
        case 'week':
          query = { created_at: { $gte: startOfWeek } };
          break;
        case 'month':
          query = { created_at: { $gte: startOfMonth } };
          break;
        case 'year':
          query = { created_at: { $gte: startOfYear } };
          break;
        case 'custom':
          query = { created_at: { $gte: parseInt(body.start_date), $lte: parseInt(body.end_date) } };
          break;
        default:
          query = {};
      }

      const start_date = parseInt(body.start_date);
      const end_date = parseInt(body.end_date);
      let data_to_aggregate;
      data_to_aggregate = [
        // await this.earningAggregation.DateFilterMatch(start_date, end_date),
        await this.earningAggregation.EarningMatch(query),
        await this.earningAggregation.bookingIdLoopup(),
        await this.earningAggregation.export_project(),
      ];
      const data = await this.model.earnings.aggregate(data_to_aggregate);
      return {
        data: data,
      };
    } catch (error) {
      console.log('error', error);
    }
  }


  
}
