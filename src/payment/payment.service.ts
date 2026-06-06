import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { Types } from 'mongoose';
import { MakePaymentDto, PaymentType, transferMoneyDto } from './dto/payment.dto';
import * as moment from 'moment';
import { OrderType } from 'src/order/dto/order.dto';
import { OrderStatus, PaymentStatus } from 'src/order/schema/order.schema';
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
import { LoyaltyPointType } from 'src/loyality-points/entities/loyality-history.entity';
import { WalletTxnCreditType, WalletTxnType } from 'src/wallet/entities/wallet-transaction.entity';
import { PaymentGateway } from 'src/configuration/dto/update-configuration.dto';
import { DriverOrderStatus } from 'src/driver-products/schema/driver-order-schema';
import { CommissionForRestaurantBy } from 'src/configuration/schema/app-configuration.schema';
import { SlotStatus } from 'src/slot/schema/slot.schema';
import { CustomerBookingStatus } from 'src/slot/schema/customer-slot.schema';
import { PlatePaymentStatus, PlateStatus } from 'src/catering_services/schema/plate.schema';
import { DealBuyStatus } from 'src/deal/schema/deal-buy.schema';
import { GroceryOrderStatus } from 'src/grocery/dto/grocery.dto';
import { filter } from 'rxjs';
import { EarningType } from 'src/earning/schema/earning.schema';
@Injectable()
export class PaymentService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly loyaltyService: LoyalityPointsService,
  ) { }
  async PaymentConfirmed(order_id: String) {
    try {

      const checkEarningAlreadyAdd = await this.model.earnings.findOne({
        order_id: order_id,
      });
      if (checkEarningAlreadyAdd) {
        throw new HttpException(
          {
            error_code: 'PAYMENT_ALREADY_CONFIRMED',
            error_descripton: 'Payment already confirmed.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const order_detail = await this.model.order.findOne({ _id: order_id });

      return { message: 'Payment confirmed.' };
    } catch (error) {
      throw error;
    }
  }

  async PaymentWithCash(body, customer) {
    try {
      const create_payment = await this.model.payment.create({
        customer_id: customer._id,
        payment_status: 'pending',
        ...body,
      });
      const key = 'order_placed';
      const localization = await this.commonService.localization(key);
      let message = localization[customer.preferred_language];
      return create_payment;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async adminPayout(page, limit) {
    try {
      const skip = (page - 1) * limit;
      let paymentDueToDriver = 0
      let paymentDueToVendor = 0
      let total_balance_in_stripe = 0
      let pending_payment_driver = await this.model.earnings.find({ pay_to_driver: "pending" })
      let pending_payment_vendor = await this.model.earnings.find({ pay_to_vendor: "pending"  })
      total_balance_in_stripe = await this.checkStripeBalance();
      for (const driverPayment of pending_payment_driver) {
        paymentDueToDriver += driverPayment.delivery_charge - driverPayment.commission_from_driver
      }
      
      for (const vendorPayment of pending_payment_vendor) {
        // if(vendorPayment.food_amount) {
        //   paymentDueToVendor += vendorPayment.food_amount - vendorPayment.commission_from_restaurant
        // }else {
        // }
        paymentDueToVendor += vendorPayment.restaurant_earning
      }


      const weeklyData = {};
      let payment = await this.model.earnings.find();

      // Get the first payment date to start from the earliest week
      const firstPaymentDate =
        payment.length > 0 ? new Date(payment[0].created_at) : new Date();
      const firstDayOfWeek = new Date(firstPaymentDate);
      firstDayOfWeek.setDate(
        firstPaymentDate.getDate() - firstPaymentDate.getDay(),
      );
      firstDayOfWeek.setHours(0, 0, 0, 0);

      // Get the current date to ensure all weeks until the present are included
      const currentDate = new Date();
      const currentDayOfWeek = currentDate.getDay();
      const lastDayOfWeek = new Date(currentDate);
      lastDayOfWeek.setDate(currentDate.getDate() + (6 - currentDayOfWeek));
      lastDayOfWeek.setHours(23, 59, 59, 999);

      let startOfWeek = firstDayOfWeek;
      let endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      while (startOfWeek <= lastDayOfWeek) {
        const weekKey = `${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`;

        weeklyData[weekKey] = {
          total_order_amount: 0,
          total_order: 0,
          total_tax_amount: 0,
          payment_to_driver: 0,
          payment_to_vendor: 0,
        };

        startOfWeek = new Date(endOfWeek);
        startOfWeek.setDate(startOfWeek.getDate() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
      }

      let payment_amount = 0;
      for (let data of payment) {


        // Calculate the week starting from Sunday
        const createdAt = new Date(data.created_at);
        const dayOfWeek = createdAt.getDay();
        const startOfWeek = new Date(createdAt);
        startOfWeek.setDate(createdAt.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekKey = `${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            total_order_amount: 0,
            total_order: 0,
            total_tax_amount: 0,
            payment_to_driver: 0,
            payment_to_vendor: 0,
          };
        }


        weeklyData[weekKey].total_order_amount += data.total_amount || 0;
        weeklyData[weekKey].total_order += 1;
        weeklyData[weekKey].total_tax_amount += data.tax || 0;
        weeklyData[weekKey].payment_to_driver += data.delivery_charge - data.commission_from_driver || 0;
        weeklyData[weekKey].payment_to_vendor += data.food_amount - data.commission_from_restaurant || 0;

      }
      // Format the response
      const formattedData = [];
      for (let weekKey in weeklyData) {
        // Reset these variables for each week
        let payment_driver = 0;
        let payment_vendor = 0;

        const [startOfWeek, endOfWeek] = weekKey.split(' to ');
        const startOfWeekDate = new Date(startOfWeek);
        const endOfWeekDate = new Date(endOfWeek);

        let pending_payment_driver = await this.model.earnings.find({ pay_to_driver: "pending" })
        let pending_payment_vendor = await this.model.earnings.find({ pay_to_vendor: "pending" })
        for (const driverPayment of pending_payment_driver) {
          payment_driver += driverPayment.delivery_charge - driverPayment.commission_from_driver
        }
        for (const vendorPayment of pending_payment_vendor) {
          payment_vendor += vendorPayment.food_amount - vendorPayment.commission_from_restaurant
        }
        // Push the data for this week
        formattedData.push({
          week_start: startOfWeekDate.getTime(),
          week_end: endOfWeekDate.getTime(),
          total_order_amount: parseFloat(weeklyData[weekKey].total_order_amount.toFixed(2)),
          total_order: weeklyData[weekKey].total_order,
          total_tax_amount: parseFloat(
            weeklyData[weekKey].total_tax_amount.toFixed(2),
          ),

          payment_due_to_driver: parseFloat(payment_driver.toFixed(2)),

          payment_due_to_vendor: parseFloat(payment_vendor.toFixed(2)), // Ensure this is a number with 2 decimal places
        });
      }
      let tax_to_be_paid = await this.tax_to_be_paid()
      formattedData.sort((a, b) => b.week_start - a.week_start);
      const paginatedFormatedData = formattedData.slice(skip, skip + limit);
      return {
        total_due_to_vendor: paymentDueToVendor,
        total_due_to_driver: paymentDueToDriver,
        total_balance_in_stripe: total_balance_in_stripe,
        tax_to_be_paid: tax_to_be_paid,
        week_data: paginatedFormatedData,
        data_count: formattedData.length
      };


    } catch (error) {
      throw error
    }
  }



  async checkStripeBalance() {
    try {
      let stripeClient = await this.commonService.createStripeClient();

      const balance = await stripeClient.balance.retrieve();
      let amount = parseFloat((balance.available[0].amount / 100).toFixed(2));
      return amount;
    } catch (error) {
      console.error('Error retrieving balance:', error);
    }
  }


  async tax_to_be_paid() {
    try {
      let PayTax = 0
      let TotalCollectTax = 0
      let tax_to_be_paid = 0
      const all_order = await this.model.order.find({
        order_status: { $nin: [null, 'cancelled', 'failed', "pos"] },
      });
      const pay_tax = await this.model.tax.find();

      for (const totaltax of pay_tax) {
        PayTax += parseFloat(totaltax.amount.toFixed(2));
      }

      for (const tax of all_order) {
        TotalCollectTax += parseFloat((tax.tax_amount) ? tax.tax_amount.toFixed(2) : '0');
      }


      let earnings = await this.model.earnings.find({ earning_type: { $in: [EarningType.Catering] } });
      for(const e of earnings){
        TotalCollectTax += parseFloat(e.tax.toFixed(2));
      }

      tax_to_be_paid = parseFloat((TotalCollectTax - PayTax).toFixed(2));
      return tax_to_be_paid
    } catch (error) {
      throw error
    }
  }

  async refund(pm_id: string) {
    try {
      let stripeClient = await this.commonService.createStripeClient();
      let refund = await stripeClient.refunds.create({ payment_intent: pm_id });
      return refund
    } catch (error) {
      throw error
    }
  }

  async webhook(headers, body, tenantId) {
    try {
      console.log("<webhook--------called");

      // handle multiple db dynamically 
      let owner = await this.commonService.tenantDetails(tenantId);
      if(!owner){
          throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
      }

      if(owner.status !== "ACTIVE"){
          throw new HttpException('Tenant is currently not available. Please contact admin for more information.', HttpStatus.NOT_FOUND);
      }

      const dbUrl = owner?.databaseUrl;
      const subdomain_slug = owner?.subdomain_slug;
      await this.model.create_tenant_connection(dbUrl, subdomain_slug);
      // handle multiple db end

      body = JSON.stringify(body, null, 2);

      let configuration = await this.model.appConfiguration.findOne().select("paymentGateway stripe");

      if(configuration.paymentGateway !== PaymentGateway.STRIPE){
        return true
      }
      const secret = configuration.stripe.secret;

      let stripeClient = await this.commonService.createStripeClient();

      const header = await stripeClient.webhooks.generateTestHeaderString({
        payload: body,
        secret,
      });



      const event = stripeClient.webhooks.constructEvent(body, header, secret);
      console.log("event.type ===", event.type);
      switch (event.type) {
        case 'payment_intent.payment_failed':
          const paymentIntentPaymentFailed = event.data.object;
          console.log(paymentIntentPaymentFailed, '<--------paymentIntentPaymentFailed',);
          // Then define and call a function to handle the event payment_intent.payment_failed
          break;
        case 'payment_intent.succeeded':

          const paymentIntentSucceeded = event.data.object;
          console.log('JSON.stringify(paymentIntentSucceeded) :>> ', JSON.stringify(paymentIntentSucceeded));
          const intentId = paymentIntentSucceeded?.id;
          const metadata = paymentIntentSucceeded?.metadata;

          if (metadata?.meta_type === 'ORDER') {
            let createOrder = null;
            let driverOrder = null;
            var customer = null;
            let paymentFor = null;
            let booking = null;


            if (paymentIntentSucceeded?.metadata?.type === PaymentType.Card) {

              console.log("INNNSSSSIDE");

              // define meta data
              const startOfToday = moment.utc().startOf('day').valueOf();
              let OrderId = paymentIntentSucceeded?.metadata?.order_id;
              let restaurant_id = paymentIntentSucceeded?.metadata?.restaurant_id;
              let customer_id = paymentIntentSucceeded?.metadata?.customer_id;
              let is_scheduled = paymentIntentSucceeded?.metadata?.is_scheduled;
              let deal_order_id = paymentIntentSucceeded?.metadata?.deal_order_id;


              let paymentFor = paymentIntentSucceeded?.metadata?.paymentFor;
              let driver_id = paymentIntentSucceeded?.metadata?.driver_id;
              let driver_name = paymentIntentSucceeded?.metadata?.driver_name;
              let booking_id = paymentIntentSucceeded?.metadata?.booking_id;
              let plate_id = paymentIntentSucceeded?.metadata?.plate_id;

              let obj: any = {
                order_id: OrderId,
                customer_id: customer_id,
                paymentFor: paymentFor,
                booking_id: booking_id,
                plate_id: plate_id,
                deal_order_id: deal_order_id,
                srtipe_intentId: intentId,
              }


              let result = await this.updateAfterPaymentSuccess(obj);
              createOrder = result["order"];
              driverOrder = result["driverOrder"];
              booking = result["booking"];



            }


            let payobj: any = {
              payment_status: 'complete',
              payment_method_id: paymentIntentSucceeded?.payment_method,
              payment_intent: intentId,
              paymentGateway: PaymentGateway.STRIPE
            }




            if (createOrder) {
              payobj.payment_type = createOrder.payment_type;
              payobj.order_id = createOrder?._id ?? null;
              payobj.customer_id = createOrder?.customer_id ?? null;
              payobj.restaurant_id = createOrder?.restaurant_id ?? null;
              payobj.total_amount = createOrder.total_amount;

            } else if (driverOrder) {

              payobj.driver_order_id = driverOrder?._id ?? null;
              payobj.total_amount = driverOrder.total_amount;

            } else if (booking) {

              payobj.booking_id = booking?._id ?? null;
              payobj.restaurant_id = booking?.restaurant_id ?? null;
              payobj.customer_id = booking?.customer_id ?? null;
              payobj.total_amount = booking?.total_booking_amount ?? 0;

            }

            const create_payment = await this.model.payment.create(payobj);

          }


          if (metadata.meta_type === 'WALLET_DEPOSIT') {
            const customer_id = metadata.customer_id;
            const amount = Number(paymentIntentSucceeded.amount_received / 100); // Stripe sends amount in cents

            const wallet = await this.model.walletModel.findOneAndUpdate(
              { customer_id: new Types.ObjectId(customer_id) },
              { $inc: { balance: amount } },
              { upsert: true, new: true }
            );

            await this.model.walletTransactionModel.create({
              customer_id: new Types.ObjectId(customer_id),
              type: WalletTxnType.CREDIT,
              amount,
              transaction_type: 'CREDIT',
              description: 'Stripe wallet deposit',
              stripe_payment_intent: intentId,
            });

            console.log(`Wallet updated for ${customer_id}, New balance: ${wallet.balance}`);
          }

          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }




  async updateCatering(plate, payment_intent, srtipe_intentId, pricing, vendor) {

    let amount = 0;
    let conditionObj: any = {
      razorpay_payment_id: payment_intent,
      stripe_payment_id: srtipe_intentId
    };

    if (plate.status == null) {

      amount = plate.advance_payment;
      conditionObj.status = PlateStatus.Requested;
      conditionObj.payment_status = PlatePaymentStatus.Partial_Payment_Done;

    } else if (plate.status === PlateStatus.Accepted) {
      amount = plate.total_payment - plate.advance_payment;
      conditionObj.payment_status = PlatePaymentStatus.Full_Payment_Done;
    }

    plate = await this.model.PlateModel.findOneAndUpdate({ _id: plate._id }, {
      $set: conditionObj
    }, { new: true })

    let commission_from_catering = 0;
    
      if (plate.status === PlateStatus.Accepted) {
        if (pricing.commission_for_restaurant_by === CommissionForRestaurantBy.Percentage) {
          commission_from_catering = (plate.booking_amount * pricing.catering_commission) / 100;
        } else {
          commission_from_catering = pricing.catering_commission;
        }

        await this.model.earnings.create({
            reference_id : plate.order_id,

            plate_id: plate._id ?? null,
              restaurant_id: plate.restaurant_id ?? null,
            vendor_id: plate.vendor_id ?? null,
            customer_id: plate?.customer_id ?? null,
            
            tax : plate?.tax ?? 0,
            total_amount: plate.total_payment,
            restaurant_earning: plate.booking_amount - commission_from_catering,
            
            food_amount : plate.booking_amount,
            commission_from_restaurant :  commission_from_catering,
            order_placed_at: moment.utc().valueOf(),
            pay_to_vendor: 'pending',
            earning_type :   EarningType.Catering
        });

      }

      

    // for notification  
    let session = await this.model.session.find({
      user_id: vendor?._id ?? null,
    });

    if (session.length > 0) {
      for (const fcm of session) {

        let title_key = "";
        let description_key = "";

        if (plate.status == null || plate.status == PlateStatus.Requested) {
          title_key = 'new_catering_booking_title';
          description_key = 'new_catering_booking_description';
        } else if (plate.status === PlateStatus.Accepted) {
          title_key = 'catering_booking_amount_title';
          description_key = 'catering_booking_amount_title_description';
        }

        const title_localization =
          await this.commonService.localization(title_key);
        const description_localization =
          await this.commonService.localization(description_key);


        let push_content = {
          title: title_localization[vendor.preferred_language],
          description:
            description_localization[vendor.preferred_language],
        };


        let push_data = {
          type: 'catering_services',
          plate_id: plate._id.toString(),
        };


        this.commonService.send_notification(
          push_content,
          fcm?.fcm_token ?? "",
          push_data,
          vendor?._id ?? ""
        );

      }
    }

    return plate;

  }


  async updateAfterPaymentSuccess(object) {

    let OrderId = object?.order_id ?? "";
    let customer_id = object?.customer_id ?? "";
    let paymentFor = object?.paymentFor ?? "";
    let booking_id = object?.booking_id ?? "";
    let plate_id = object?.plate_id ?? "";
    let deal_order_id = object?.deal_order_id ?? "";
    // let grocery_order_id = object?.grocery_order_id ?? "";
    let srtipe_intentId = object?.srtipe_intentId ?? "";
    let payment_intent = object?.payment_intent ?? "";
    let wallet_amount = object?.wallet_amount ?? 0;


    let obj = {};
    let booking = booking_id ? await this.model.CustomerSlotModel.findById(booking_id).populate("slot_id") : null;
    var createOrder = OrderId ? await this.model.order.findById(OrderId) : null;
    var plate = plate_id ? await this.model.PlateModel.findById(plate_id) : null;




    console.log("createOrder =============", createOrder);



    var restaurant = null;
    if (booking && booking.restaurant_id) {
      restaurant = await this.model.restaurant.findById(booking.restaurant_id).populate('vendor_id');
    } else if (createOrder && createOrder.restaurant_id) {
      restaurant = await this.model.restaurant.findById(createOrder.restaurant_id).populate('vendor_id');
    } else if (plate && plate.restaurant_id) {
      restaurant = await this.model.restaurant.findById(plate.restaurant_id).populate('vendor_id');
    }


    var vendor: any = null;
    if (restaurant && restaurant.vendor_id) {
      vendor = restaurant.vendor_id;
    }

    var session = null;
    var pricing = await this.model.appConfiguration.findOne();
    var driverOrder = null;

    var customer = customer_id ? await this.model.customer.findById(customer_id) : null;
    var dealOrder = null;

    if (paymentFor == "driver_order") {
      driverOrder = await this.driverOrderUpdate(OrderId, DriverOrderStatus.placed);
    } else if (paymentFor == "wallet" && customer) {
      await this.updateWallet(customer, wallet_amount);
    } else if (paymentFor == "catering" && plate) {
      plate = await this.updateCatering(plate, payment_intent, srtipe_intentId, pricing, vendor);
    } else if (paymentFor == "deal" && deal_order_id) {
      dealOrder = await this.updateDealOrder(deal_order_id, payment_intent, srtipe_intentId);
    }
    else if (paymentFor == "slot_booking" && booking && restaurant && vendor) {
      booking = await this.upateBooking(booking, vendor, payment_intent, srtipe_intentId);
    } else if (createOrder && vendor) {
      createOrder = await this.updateOrder(createOrder, pricing, vendor);
    }





    obj["order"] = await createOrder;
    obj["driverOrder"] = await driverOrder;
    obj["booking"] = await booking;
    obj["paymentFor"] = await paymentFor;

    return obj;
  }


  async driverOrderUpdate(OrderId, status) {
    
    let driverOrder = await this.model.DriverOrderModel.findOneAndUpdate(
      { _id: new Types.ObjectId(OrderId) },
      { status: DriverOrderStatus.placed },
      { new: true }
    );

    await this.model.earnings.create({
      driver_order_id : driverOrder?._id ?? null,
      // restaurant_id: driverOrder?.restaurant_id ?? null,
      // customer_id: driverOrder?.customer_id ?? null,
      // food_amount: driverOrder?.cart_amount ?? 0,
      // delivery_charge: createOrder?.delivery_fee ?? 0,
      // tip_amount: createOrder?.tip_amount ?? 0,
      total_amount: driverOrder.total_amount,
      app_commission: 0,
      // restaurant_earning: restaurant_earning,
      // driver_earning: driver_earning,
      // commission_from_restaurant: commission_from_restaurant,
      // commission_from_driver: commission_from_driver,
      // tax: createOrder.tax_amount,
      // payment_type: driverOrder.payment_type,
      // order_placed_at: createOrder.order_placed_at,
      // pay_to_vendor: 'pending',
      // pay_to_driver: 'pending',

      // earning_type: createOrder?.order_type ?? null,
      
    });












    return driverOrder;
  }

  async updateWallet(customer, wallet_amount) {
    // Credit wallet to referrer
    let wallet = await this.model.walletModel.findOne({ customer_id: customer._id });
    if (wallet) {
      wallet.balance += wallet_amount;
      await wallet.save();
    } else {
      wallet = await this.model.walletModel.create({
        customer_id: customer._id,
        balance: wallet_amount,
      });
    }

    await this.model.walletTransactionModel.create({
      customer_id: customer._id,
      type: WalletTxnType.CREDIT,
      credit_type: WalletTxnCreditType.Point,
      amount: wallet_amount,
      description: "Wallet deposit",
    });

  }


  async updateDealOrder(deal_order_id, payment_intent, srtipe_intentId) {
    let dealOrder = await this.model.DealBuyModel.findById(deal_order_id);
    dealOrder.status = DealBuyStatus.Placed;
    dealOrder.payment_status = PaymentStatus.Complete;
    dealOrder.razorpay_payment_id = payment_intent;
    dealOrder.stripe_payment_id = srtipe_intentId;
    await dealOrder.save();


    await this.model.earnings.create({
      reference_id : dealOrder?.order_id ?? null,
      deal_order_id: dealOrder._id ?? null,
      restaurant_id: dealOrder.restaurant_id ?? null,
      customer_id: dealOrder?.customer_id ?? null,
      total_amount: dealOrder.total_amount,
      restaurant_earning: dealOrder.total_amount,
      order_placed_at: moment.utc().valueOf(),
      pay_to_vendor: 'pending',
      food_amount : dealOrder?.amount ?? 0, 
      tax : dealOrder?.tax ?? 0,
      earning_type : EarningType.Deal
    });

    return dealOrder;
  }



  async upateBooking(booking, vender, payment_intent, srtipe_intentId) {

    let slot: any = booking.slot_id;
    slot.status = SlotStatus.Booked;
    slot.maximum_capacity_slot = slot.maximum_capacity_slot - booking.no_of_guest;
    await slot.save();

    booking = await this.model.CustomerSlotModel.findOneAndUpdate({ _id: booking._id }, {
      $set: {
        status: CustomerBookingStatus.Paid,
        razorpay_payment_id: payment_intent,
        stripe_payment_id: srtipe_intentId
      }
    }, { new: true })


    // for notification  
    let session = await this.model.session.find({
      user_id: vender?._id ?? null,
    });

    if (session.length > 0) {
      for (const fcm of session) {

        const title_key = 'slot_booked_title';
        const description_key = 'slot_booked_description';
        const title_localization =
          await this.commonService.localization(title_key);
        const description_localization =
          await this.commonService.localization(description_key);


        let push_content = {
          title: title_localization[vender.preferred_language],
          description:
            description_localization[vender.preferred_language],
        };
        let push_data = {
          type: 'slot_booked',
          slot_id: slot._id.toString(),
          booking_id: booking._id.toString(),
        };


        this.commonService.send_notification(
          push_content,
          fcm?.fcm_token ?? "",
          push_data,
          vender?._id ?? ""
        );

      }

    }


    return booking;

  }


  async updateOrder(createOrder, pricing, vender) {
    let conditionObj: any = {
      payment_status: PaymentStatus.Complete
    };

    console.log("update order ===>>>>", createOrder)

    if (createOrder.scheduled_time !== null && createOrder.scheduled_time) {
      conditionObj.order_status = OrderStatus.scheduled;
    } else {
      conditionObj.order_status = OrderStatus.OrderPlaced;
      conditionObj.order_placed_at = moment.utc().valueOf();
    }



    //Ordinal formatter
    function getOrdinal(n: number) {
      const s = ["th", "st", "nd", "rd"],
        v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    let user_order_count = await this.model.order.countDocuments({
      restaurant_id: createOrder.restaurant_id,
      customer_id: createOrder.customer_id,
      order_status: { $nin: ['cancelled', 'failed', "pending", null] }
    });
    conditionObj.user_order_count = getOrdinal(user_order_count || 1)

    createOrder = await this.model.order.findOneAndUpdate({ _id: createOrder._id }, {
      $set: conditionObj
    }, { new: true });


    if (createOrder.order_status == OrderStatus.OrderPlaced) {

      if (createOrder.grocery_cart_items?.length > 0) {

        for (const item of createOrder.grocery_cart_items || []) {

          let filter: any = {
            restaurant_id: createOrder.restaurant_id,
            grocery_id: item.grocery_id,
            total_stock: { $gte: item.no_of_quantity },
          }

          if (item.cloth_stock_id !== undefined && item.cloth_stock_id !== null && item.cloth_stock_id !== "") {
            filter._id = item.cloth_stock_id;
          }

          await this.model.stock.findOneAndUpdate(
            filter,
            {
              $inc: { total_stock: -item.no_of_quantity },
            },
            { new: true }
          );

        }

      }
    }

    // delete entry where stock is not avalable 
    await this.model.stock.deleteMany({ total_stock: 0 });
    createOrder.total_amount += createOrder.tip_amount;


    

    let session = await this.model.session.find({
      user_id: vender._id,
    });

    if (session.length > 0) {
      for (const fcm of session) {

        const title_localization = await this.commonService.localization("new_order_restaurant_title");
        const description_localization = await this.commonService.localization("new_order_restaurant_description");

        let push_content = {
          title: title_localization[vender.preferred_language],
          description:
            description_localization[vender.preferred_language],
        };

        let push_data = {
          type: 'order_received',
          order_id: createOrder._id.toString(),
          redirectPath: `/orderDetail?id=${createOrder._id.toString()}`
        };

        this.commonService.send_notification(
          push_content,
          fcm?.fcm_token ?? "",
          push_data,
          vender?._id ?? ""
        );

      }
    }

    return createOrder;
  }

}