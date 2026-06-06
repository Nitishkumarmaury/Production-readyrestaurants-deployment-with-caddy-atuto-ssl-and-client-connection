import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as moment from 'moment';
import mongoose, { Types } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { OrderService } from 'src/order/order.service';
import { VendorAggregation } from './vendor.aggregation';
import { SocketGateway } from 'src/socket/socket.gateway';

import { OrderStatus, RiderStatus } from 'src/order/schema/order.schema';
import { PaymentStatus } from 'src/order/schema/order.schema';
import { LoyaltyPointType } from 'src/loyality-points/entities/loyality-history.entity';
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
import { OrderDeliver, OrderType } from 'src/order/dto/order.dto';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { WalletTxnCreditType, WalletTxnType } from 'src/wallet/entities/wallet-transaction.entity';
import { payment_type } from 'src/payment/schema/payment.schema';

@Injectable()
export class VendorService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly orderService: OrderService,
    private readonly loyaltyService: LoyalityPointsService,
    private readonly vendorAggregation: VendorAggregation,
    private readonly socketGateway: SocketGateway,
    private readonly configService: ConfigService,
  ) { }

  async TodayOrders(body) {
    try {
      let query : any = {};
      const skip = (body.page - 1) * body.limit;
      if (body.status === 'pending') {
        query = {
          restaurant_id: new Types.ObjectId(body.restaurant_id),
          order_status: 'order_placed',
          payment_status: PaymentStatus.Complete,
        };
      } else if (body.status === 'prepared') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'order_confirmed',
        };
      } else if (body.status === 'ready' || body.status === 'ready_for_pickup') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'ready_for_pickup',
        };
      } else if (body.status === 'picked_up') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'picked_up',
        };
      } else if (body.status === 'delivered') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'delivered',
        };
      } else if (body.status === 'scheduled') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'scheduled',
        };
      } else if (body.status === 'pos') {
        query = {
          restaurant_id: body.restaurant_id,
          order_status: 'pos',
        };
      }

      if(body.type !== undefined && body.type !== ""){
        query.order_type = body.type;
      }else {
        query.order_type = { $ne: OrderType.Table_order };
      }

      let appConfig = await this.model.appConfiguration.findOne();    
      let is_fixed_time_delivery = appConfig?.is_fixed_time_delivery || false;
      query.is_fixed_time_delivery = is_fixed_time_delivery || false;

      let orders_count = await this.model.order.countDocuments(query);
      let orders: any = await this.model.order
        .find(query)
        .populate([
          { path: 'restaurant_id' },
          { path: 'customer_id' },
          { path: 'driver_id' },
        ])
        .skip(skip)
        .limit(body.limit)
        .sort({ order_placed_at: -1 });


      // ✅ Step 2 – Calculate how many orders each user has made for this restaurant
      // const customerIds = [...new Set(orders.map(o => o.customer_id._id.toString()))];
      // const restaurantObjectId = new Types.ObjectId(body.restaurant_id);

      // const counts = await this.model.order.aggregate([
      //   {
      //     $match: {
      //       restaurant_id: restaurantObjectId,
      //       customer_id: { $in: customerIds.map((id: any) => new Types.ObjectId(id)) }
      //     }
      //   },
      //   {
      //     $group: {
      //       _id: "$customer_id",
      //       totalOrders: { $sum: 1 }
      //     }
      //   }
      // ]);

      // // Convert counts to a map for quick lookup
      // const countsMap = {};
      // counts.forEach(c => {
      //   countsMap[c._id.toString()] = c.totalOrders;
      // });

      // //Ordinal formatter
      // function getOrdinal(n: number) {
      //   const s = ["th", "st", "nd", "rd"],
      //     v = n % 100;
      //   return n + (s[(v - 20) % 10] || s[v] || s[0]);
      // }

      // // Attach formatted user_order_count
      // orders = orders.map(order => ({
      //   ...order.toObject(),
      //   user_order_count: getOrdinal(countsMap[order.customer_id._id.toString()] || 1)
      // }));

      return { data_count: orders_count, data: orders };
    } catch (error) {
      throw error;
    }
  }

  async Orders(body) {
    try {

      let query = {};

      const page = parseInt(body.page) || 1;
      const limit = parseInt(body.limit) || 10;
      const skip = (page - 1) * limit;

      if (body.status === 'today') {
        const startOfToday = moment.utc().startOf('day').valueOf();
        query = {
          order_status: { $ne: 'order_placed' },
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: startOfToday },
          payment_status: "complete"
        };
      } else if (body.status === 'week') {
        const startOfWeek = moment.utc().startOf('week').valueOf();
        query = {
          order_status: { $ne: 'order_placed' },
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: startOfWeek },
          payment_status: "complete"
        };
      } else if (body.status === 'month') {
        const startOfMonth = moment.utc().startOf('month').valueOf();
        query = {
          order_status: { $ne: 'order_placed' },
          restaurant_id: new mongoose.Types.ObjectId(body.restaurant_id),
          order_placed_at: { $gte: startOfMonth },
          payment_status: "complete"
        };
      }
      console.log('data', query);
      let data_to_aggregate = [
        await this.vendorAggregation.match(query),
        await this.vendorAggregation.driverLookup(),
        await this.vendorAggregation.UnwindDriverLookup(),
        // await this.vendorAggregation.orderLookup(),
        // await this.vendorAggregation.project(),
        await this.vendorAggregation.set_data(),
        await this.vendorAggregation.face_set(skip, limit),
      ];
      let data = await this.model.order.aggregate(data_to_aggregate);
      console.log('data', data);

      return {
        count: data[0]?.count[0]?.count,
        total_earning: data[0]?.total_earning[0]?.total_earning,
        data: data[0]?.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async UpdateOrderStatus(body, user_info) {
    try {
      let push_content;

      let order: any = await this.model.order
        .findOne({ _id: body.order_id })
        .populate([
          { path: 'customer_id' },
          { path: 'restaurant_id' },
          { path: 'driver_id' },
        ]);

      let customer: any = order.customer_id;
      let driver: any = order.driver_id;

      const preferredLanguage = customer.preferred_language;
      const session = await this.model.session.find({
        user_id: customer._id,
      });

      let query = {};
      if (body.status === 'accept') {

        if (order.order_status == OrderStatus.Cancelled) {
          throw new HttpException(
            {
              error_code: 'order_cancelled_by_customer',
              error_description: 'The order has been cancelled by the customer.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        query = {
          order_status: 'order_confirmed',
          is_open_for_driver: true,
          order_confirmed_at: moment.utc().valueOf(),
        };

        if (order.deliver_type == OrderDeliver.Driver && !order.is_fixed_time_delivery) {
          this.sendPushToNearestDrivers(order, moment.utc().valueOf());
        }

        const title_localization = await this.commonService.localization("order_prepared_title");
        const description_localization = await this.commonService.localization("order_prepared_description");

        push_content = {
          title: title_localization[preferredLanguage],
          description: description_localization[preferredLanguage],
        };


      } else if (body.status === 'decline') {

        query = {
          order_status: OrderStatus.Cancelled,
        };


        const title_localization = await this.commonService.localization("order_declined_title");
        const description_localization = await this.commonService.localization("order_declined_description");
        push_content = {
          title: title_localization[preferredLanguage],
          description: description_localization[preferredLanguage],
        };


      } else if (body.status === 'ready') {

        if (order.is_scheduled != undefined && order.is_scheduled) {

          if (order.order_status == OrderStatus.Cancelled) {
            throw new HttpException(
              {
                error_code: 'order_cancelled_by_customer',
                error_description: 'The order has been cancelled by the customer.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }

          query = {
            order_status: 'order_confirmed',
            is_open_for_driver: true,
            order_confirmed_at: moment.utc().valueOf(),
            order_preparing_at: moment.utc().valueOf(),
          };

          if (order.deliver_type == OrderDeliver.Driver) {
            this.sendPushToNearestDrivers(order, moment.utc().valueOf());
          }

          const title_localization = await this.commonService.localization("order_prepared_title");
          const description_localization = await this.commonService.localization("order_prepared_description");
          push_content = {
            title: title_localization[preferredLanguage],
            description: description_localization[preferredLanguage],
          };

        } else {

          query = {
            order_status: 'ready_for_pickup',
            order_ready_at: moment.utc().valueOf(),
          };


          const title_localization = await this.commonService.localization("order_ready_title");
          const description_localization = await this.commonService.localization("order_ready_description");
          push_content = {
            title: title_localization[preferredLanguage],
            description: description_localization[preferredLanguage],
          };

        }

        // send notificatin to driver 
        if (driver) {
          // for notification  
          let sessionForDriver = await this.model.session.find({
            user_id: driver._id ?? null,
          });

          if (sessionForDriver.length > 0) {
            for (const fcm of sessionForDriver) {
              const title_localization = await this.commonService.localization("driver_order_ready_title");
              const description_localization = await this.commonService.localization("driver_order_ready_description");

              let push_content = {
                title: title_localization[driver.preferred_language],
                description:
                  description_localization[driver.preferred_language],
              };
              let push_data = {
                type: 'order_received',
                order_id: order._id.toString(),
                redirectPath: `/orderDetail?id=${order._id.toString()}`
              };



              this.commonService.send_notification(
                push_content,
                fcm?.fcm_token ?? "",
                push_data,
                driver._id ?? ""
              );

            }
          }
        }

      } else if (body.status === 'delivered') {


        // if (body.otp == undefined || body.otp == "") {
        //   throw new HttpException(
        //     {
        //       error_code: 'please provide otp',
        //       error_description: 'please provide otp',
        //     },
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        // if (body.otp != order.delivery_otp) {
        //   throw new HttpException(
        //     {
        //       error_code: 'Invalid OTP',
        //       error_description: 'Invalid OTP',
        //     },
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        query = {
          rider_status: RiderStatus.Delivered,
          order_status: OrderStatus.Delivered,
          order_delivered_at: moment.utc().valueOf()
        }

        await this.model.restaurant.findByIdAndUpdate(
          order.restaurant_id,
          { $inc: { total_orders: 1 } }
        );

        if (order?.cart_items && order.cart_items.length > 0) {
          order.cart_items.map(async (item, key) => {
            await this.model.food.findByIdAndUpdate(
              item.food_id,
              {
                $inc: {
                  trending_count: 1
                },
              },
              { new: true }
            );
          });
        }


        // create order earning 
        await this.commonService.createOrderEarning(order);



        // increase order count on food 
        if (order?.cart_items && order.cart_items.length > 0) {
          order.cart_items.map(async (item, key) => {
            await this.model.food.findByIdAndUpdate(
              item.food_id,
              {
                $inc: {
                  order_count: 1,
                },
              },
              { new: true }
            );
          });
        }

        // Loyalty + Referral logic
        const customer = await this.model.customer.findOne({ _id: order.customer_id });

        this.loyaltyService.manageReferralAfterFinalOrder(customer);

        const appConfig = await this.model.appConfiguration.findOne();
        // eligible for points 
        if (appConfig && appConfig.loyalty && appConfig.loyalty_minimun_order && order.cart_amount > appConfig.loyalty_minimun_order) {

          // calculate points 
          let amount_per_loyalty = appConfig?.amount_per_loyalty ?? 20;

          let earnedPoints = Math.trunc(order.cart_amount / amount_per_loyalty);

          if (earnedPoints > 0) {
            await this.loyaltyService.awardPoints(
              customer._id,
              order._id,
              earnedPoints,
              LoyaltyPointType.EARNED,
              'Points awarded for order payment'
            );

            console.log(`✅ Awarded ${earnedPoints} loyalty points to user ${customer._id}`);
          }

        }

        push_content = {
          title: "Order Picked Up",
          description: "Your order has been picked up",
        };

      } else if (body.status === 'picked_up') {


        query = {
          order_status: 'picked_up',
          order_picked_up_at: moment.utc().valueOf(),
        };

        const title_key = 'order_picked_up_title';
        const description_key = 'order_picked_up_description';
        const title_localization =
          await this.commonService.localization(title_key);
        const description_localization =
          await this.commonService.localization(description_key);
        push_content = {
          title: title_localization[preferredLanguage],
          description: description_localization[preferredLanguage],
        };
      }



      const updatedOrder = await this.model.order.findOneAndUpdate(
        { _id: body.order_id },
        query,
        { new: true },
      );


      if (updatedOrder && updatedOrder.order_status == OrderStatus.Cancelled) {

        await this.orderService.handleCanelOrder(updatedOrder._id, updatedOrder.customer_id);
      }

      if (session.length > 0) {
        const fcmTokens: any = session.map(s => s.fcm_token);

        let push_data = {
          order: updatedOrder._id,
          order_id: updatedOrder._id,
          type: 'order_update',
          redirectPath: `orderDetail?id=${updatedOrder._id}`
        };

        await this.commonService.send_bulk_notifications(
          push_content,
          fcmTokens,
          push_data
        );


        await this.model.NotificationModel.create({
          notification: {
            title: push_content?.title ?? "",
            body: push_content?.description ?? "",
          },

          data: push_data,
          userId: order.customer_id._id,
          resturantId: order.restaurant_id._id,
          isCustomer: true,
          isVendor: false,
          isDriver: false,
          isRead: false,
          isDeleted: false,
        });


        const localization = await this.commonService.localization("order_update");

        return { message: localization[user_info.preferred_language] };
      }





    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async OrderCount(restaurant_id: string) {
    try {
      let totalTodayEarning = 0;
      let totalWeekEarning = 0;
      let totalMonthEarning = 0;
      const startOfToday = moment.utc().startOf('day').valueOf();
      const startOfWeek = moment.utc().startOf('week').valueOf();
      const startOfMonth = moment.utc().startOf('month').valueOf();
      // Today's orders

      const todayOrders = await this.model.order.countDocuments({
        restaurant_id: restaurant_id,
        // order_placed_at: { $gte: startOfToday },
        createdAt: { $gte: startOfToday },
        payment_status: "complete"

      });

      // This week's orders
      const weekOrders = await this.model.order.countDocuments({
        restaurant_id: restaurant_id,
        payment_status: "complete",
        order_placed_at: { $gte: startOfWeek },
      });


      // This month's orders
      const monthOrders = await this.model.order.countDocuments({
        restaurant_id: restaurant_id,
        payment_status: "complete",
        order_placed_at: { $gte: startOfMonth },
      });

      console.log("startOfMonth.....", startOfMonth, moment(startOfMonth).format('lll'));

      const todayearnings = await this.model.earnings.find(
        {
          restaurant_id: restaurant_id,
          order_placed_at: { $gte: startOfToday },

        })
        .populate<{ order_id: { order_status: string } }>({  // <{ order_id: { order_status: string } }>
          path: "order_id",
          select: "order_status"
        });

      for (const today of todayearnings) {

        if (today.order_id?.order_status === "delivered") {
          totalTodayEarning += today.restaurant_earning;
        }

        if (today.booking_id !== null) {
          totalTodayEarning += today.total_amount;
        }

      }


      // This week's orders
      const weekEarnings = await this.model.earnings.find({
        restaurant_id: restaurant_id,
        order_placed_at: { $gte: startOfWeek },
      }).populate<{ order_id: { order_status: string } }>({
        path: "order_id",
        select: "order_status",
      });

      for (const week of weekEarnings) {
        if (week.order_id?.order_status === "delivered") {
          totalWeekEarning += week.restaurant_earning;
        }

        if (week.booking_id !== null) {
          totalWeekEarning += week.total_amount;
        }

      }


      // This month's orders
      const monthEarnings = await this.model.earnings.find({
        restaurant_id: restaurant_id,
        order_placed_at: { $gte: startOfMonth },
      }).populate<{ order_id: { order_status: string } }>({
        path: "order_id",
        select: "order_status",
      });

      for (const month of monthEarnings) {
        if (month.order_id?.order_status === "delivered") {
          totalMonthEarning += month.restaurant_earning;
        }

        if (month.booking_id !== null) {
          totalMonthEarning += month.total_amount;
        }

      }

      return {
        todayOrders: todayOrders,
        weekOrders: weekOrders,
        monthOrders: monthOrders,
        totalTodayEarning: totalTodayEarning.toFixed(2),
        totalWeekEarning: totalWeekEarning.toFixed(2),
        totalMonthEarning: totalMonthEarning.toFixed(2),
        todayearnings
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async OngoingOrders(restaurant_id: String) {
    try {
      const OngoingOrders = await this.model.order.find({
        restaurant_id: restaurant_id,
        order_status: 'order_confirmed',
      });
      return { data: OngoingOrders };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async AddMoreTime(body) {
    try {
      const update_time = await this.model.order.findOneAndUpdate(
        { _id: body.order_id },
        {
          more_time_required_at: moment.utc().valueOf(),
          add_more_time: body.time,
        },
        { new: true },
      );
      return { data: update_time };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async FindDeliveryPartnersUnder7Kms(data, order_confirmed_at) {

    console.log(" ===== FindDeliveryPartnersUnder7Kms ");


    const TIME_LIMIT = 300; // 5 minutes in milliseconds
    const startTime = Date.now();
    while (true) {
      const order_detail = await this.model.order.findOne({ _id: data._id });
      const restaurant: any = await this.model.restaurant.findOne({ _id: order_detail.restaurant_id }, { address: 1 }, { lean: true })
      if (order_detail.order_status === 'cancelled') {
        throw new HttpException(
          {
            error_code: 'order_cancelled by customer',
            error_description: 'order_cancelled_by_customer',
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        try {
          let current_time: any = moment.utc().valueOf();
          let time_difference_ms = current_time - order_confirmed_at;
          let time_difference_sec = time_difference_ms / 1000;
          let bookings_sec = Math.round(time_difference_sec);
          if (bookings_sec > TIME_LIMIT) {
            throw new HttpException(
              {
                error_code: 'DRIVER_NOT_AVAILABLE',
                error_description: 'Driver not available',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
          let driversIdsUnderRadius: any[] = [];

          const restroLong = parseFloat(restaurant.address.long);
          const restroLat = parseFloat(restaurant.address.lat);

          const app_config = await this.model.appConfiguration.findOne();

          const driversWithDistances = await this.model.driver.aggregate([
            {
              $geoNear: {
                near: { type: "Point", coordinates: [restroLong, restroLat] },
                distanceField: "distance",
                maxDistance: 120000 * 1000,// app_config.order_taking_range ? Number(app_config.order_taking_range) : 10000,
                spherical: true
              }
            },
            {
              $match: {
                status: 'online',
                ride_status: 'free',
                is_active: true,
                is_block: false,
                is_approved: true,
                is_deleted: false,
              }
            },
            {
              $project: {
                driver_id: "$_id",
                distance: 1
              }
            },
            { $sort: { distance: 1 } }
          ]);

          // const driversWithDistances2 = await this.model.driver.aggregate([

          //   {
          //     $match: {
          //       status: 'online',
          //       ride_status: 'free',
          //       is_active: true,
          //       is_block: false,
          //       is_approved: true,
          //       is_deleted: false,
          //     }
          //   },
          //   {
          //     $project: {
          //       driver_id: "$_id",
          //       distance: 1
          //     }
          //   },
          //   { $sort: { distance: 1 } }
          // ]);

          console.log("driversWithDistances", driversWithDistances);
          // console.log("driversWithDistances2", driversWithDistances2);

          // Extract and push driver IDs into the same_vehicle_driver array
          driversIdsUnderRadius = driversWithDistances.map(
            (driver) => driver.driver_id,
          );

          const already_noti_send: any =
            await this.model.orderDriverRequests.findOne({
              order_id: new mongoose.Types.ObjectId(data._id),
            });

          let customer_detail = await this.model.customer.findOne({
            _id: data.customer_id._id,
          });

          for (const driverId of driversIdsUnderRadius) {
            const query = {
              $and: [
                { _id: driverId, },
                {
                  status: 'online',
                  ride_status: 'free',
                  is_deleted: false,
                  is_approved: true,
                  currently_send_ride_request: false,
                },
              ],
            };
            if (already_noti_send?.driver_ids?.length) {
              const drivers = already_noti_send.driver_ids.map((res: string) => new Types.ObjectId(res));
              query.$and.push({ _id: { $nin: drivers } });
            }
            // console.log(JSON.stringify(query), '<-----query ');
            const driverLocation = await this.model.driver.findOne(
              query,
              {
                latitude: 1,
                longitude: 1,
                _id: 1,
                preferred_language: 1,
                preferred_currency: 1,
              },
            );
            console.log('driverLocation', driverLocation);

            if (driverLocation) {
              return driverLocation;
            }
          }
        } catch (error) {
          console.log('error', error);
          throw error;
        }
      }
      await this.delayLoop(1000)
    }
  }
  async delayLoop(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendPushToNearestDrivers(data: any, order_confirmed_at): Promise<any> {
    try {
      const notificationType = this.configService.get('ORDER_NOTIFICATION_TYPE') || 'one_by_one';
      console.log(`Notification Type: ${notificationType}`);

      // switch (notificationType) {
      //   case 'broadcast':
      return await this.sendBroadcastNotification(data, order_confirmed_at);
      //   case 'one_by_one':
      //   default:
      //     return await this.sendOneByOneNotification(data, order_confirmed_at);
      // }

    } catch (error) {
      console.error('Error in sendPushToNearestDrivers:', error);
      throw new Error(error.message);
    }
  }

  async sendOneByOneNotification(data: any, order_confirmed_at): Promise<any> {
    try {
      console.log("sendOneByOneNotification--called");

      let driverFound = false;
      while (!driverFound) {
        const driver: any = await this.findDriver(data, order_confirmed_at);
        if (!driver) {
          console.log('No drivers found.');
          driverFound = true;
          break;
        }

        const order = await this.model.order
          .findOne({ _id: data?._id }, { cart_items: 0 })
          .populate([
            { path: 'restaurant_id', select: 'restaurant_name address food_type image country_code restaurant_phone' },
            { path: 'customer_id', select: "name email country_code phone image" },
          ]);
        const driverFCMToken = await this.getDriverFCMToken(driver._id);
        console.log('driverfcm', driverFCMToken);

        if (driverFCMToken) {
          await this.sendNotificationAndHandleDriver(data, driver, order, driverFCMToken);
          const driverAccepted = await this.checkDriverResponse(data._id, driver._id);

          let update = { $addToSet: { order_open_for: new mongoose.Types.ObjectId(driver._id) } }
          await this.model.order.findByIdAndUpdate({ _id: data._id }, update, { new: true });

          if (driverAccepted) {
            driverFound = true;
          }
        } else {
          console.log('FCM token is empty for driver:', driver._id);
          await this.updateOrderDriverRequests(data._id, driver._id);
        }
      }
      return driverFound
        ? { message: 'Driver accepted the request' }
        : { message: 'No driver found' };
    } catch (error) {
      throw error;
    }
  }

  async sendBroadcastNotification(data: any, order_confirmed_at): Promise<any> {
    try {
      console.log("sendBroadcastNotification--called");

      // 1. Find all eligible drivers
      const driversInRange = await this.findAllDriversInRange(data);
      if (!driversInRange || driversInRange.length === 0) {
        console.log('No drivers found in range for broadcast.');
        return { message: 'No driver found' };
      }

      const order = await this.model.order
        .findOne({ _id: data?._id }, { cart_items: 0 })
        .populate([
          { path: 'restaurant_id', select: 'restaurant_name address food_type image country_code restaurant_phone' },
          { path: 'customer_id', select: "name email country_code phone image" },
        ]);

      // 2. Send notification to all drivers simultaneously
      const notificationPromises = driversInRange.map(async (driver) => {
        const fcmToken = await this.getDriverFCMToken(driver._id);
        if (fcmToken) {
          await this.sendNotificationAndHandleDriver(data, driver, order, fcmToken);
        } else {
          // If no FCM token, still update driver status and order requests
          await this.updateDriverStatus(driver?._id, true, order?._id);
          await this.updateOrderDriverRequests(data._id, driver._id);
        }

        // Send socket event regardless of FCM token
        if (driver.socket_id) {
          console.log(`Sending socket event to driver: ${driver._id} (${driver.socket_id})`);
          this.socketGateway.server.to(driver.socket_id).emit('current_ride_request', {
            booking: order,
            generated_at: Date.now()
          });
        }
      });

      await Promise.all(notificationPromises);

      // 3. Wait for any driver to accept (max 30 seconds loop)
      let driverFound = false;
      for (let i = 0; i < 30; i++) {
        await this.sleep(1000);

        // Check if anyone accepted in declined_bookings collection
        const acceptance = await this.model.declined_bookings.findOne({
          order_id: data._id,
          status: 'accepted'
        });

        const currentOrder = await this.model.order.findOne({ _id: data._id });

        if (currentOrder?.order_status === 'cancelled') {
          // Notify remaining drivers to remove request
          await this.clearRequestFromDrivers(driversInRange, data._id);
          return { message: 'Order cancelled' };
        }

        if (acceptance) {
          driverFound = true;
          // Notify other drivers to remove request
          const otherDrivers = driversInRange.filter(d => d._id.toString() !== acceptance.driver_id.toString());
          await this.clearRequestFromDrivers(otherDrivers, data._id);
          break;
        }
      }

      if (!driverFound) {
        // Mark as declined for all drivers if no one accepted
        for (const driver of driversInRange) {
          await this.model.declined_bookings.findOneAndUpdate(
            { order_id: data._id, driver_id: driver._id },
            { status: 'decline' },
            { upsert: true }
          );
          await this.declineRequestUpdateDriver(driver._id);
        }
        await this.clearRequestFromDrivers(driversInRange, data._id);
      }

      return driverFound
        ? { message: 'Driver accepted the request' }
        : { message: 'No driver found' };
    } catch (error) {
      throw error;
    }
  }

  async findAllDriversInRange(data) {
    const order_detail = await this.model.order.findOne({ _id: data._id });
    const restaurant: any = await this.model.restaurant.findOne({ _id: order_detail.restaurant_id }, { address: 1 }, { lean: true });

    const restroLong = parseFloat(restaurant.address.long);
    const restroLat = parseFloat(restaurant.address.lat);

    console.log("restroLong, restroLat", restroLong, restroLat);

    const drivers = await this.model.driver.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [restroLong, restroLat] },
          distanceField: "distance",
          maxDistance: 120000 * 1000,
          spherical: true
        }
      },
      {
        $match: {
          status: 'online',
          ride_status: 'free',
          is_active: true,
          is_block: false,
          is_approved: true,
          is_deleted: false,
          currently_send_ride_request: false,

        }
      }
    ]);

    console.log("111 drivers =======>> ", drivers.length);
    return drivers;
  }

  async findAllDriversInRangeInAcceptOrder(data) {
    const order_detail = await this.model.order.findOne({ _id: data._id });
    const restaurant: any = await this.model.restaurant.findOne({ _id: order_detail.restaurant_id }, { address: 1 }, { lean: true });

    const restroLong = parseFloat(restaurant.address.long);
    const restroLat = parseFloat(restaurant.address.lat);

    console.log("restroLong, restroLat", restroLong, restroLat);

    const drivers = await this.model.driver.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [restroLong, restroLat] },
          distanceField: "distance",
          maxDistance: 120000 * 1000,
          spherical: true
        }
      },
      {
        $match: {
          status: 'online',
          ride_status: 'free',
          is_active: true,
          is_block: false,
          is_approved: true,
          is_deleted: false,
          // currently_send_ride_request: false,

        }
      }
    ]);

    console.log("111 drivers =======>> ", drivers.length);
    return drivers;
  }

  async clearRequestFromDrivers(drivers, orderId) {

    for (const driver of drivers) {
      // console.log(" driver.socket_id===>>>>>>>>>",driver.email, new Date().toString());
      if (driver.socket_id) {
        
        this.socketGateway.server.to(driver.socket_id).emit('remove_ride_request', { order_id: orderId });
        
        this.socketGateway.server.to(driver.socket_id).emit('remove_ride_request_test', { order_id: orderId });
        
        
        console.log('remove_ride_request', driver.email, driver.socket_id, new Date().toString());

      }
      await this.declineRequestUpdateDriver(driver._id);
    }
  }

  async sendPushToNearestDriversCron(data: any, order_confirmed_at): Promise<any> {
    return this.sendPushToNearestDrivers(data, order_confirmed_at);
  }

  // Helper: Find delivery partners within a 7km radius
  async findDriver(data, order_confirmed_at) {
    return this.FindDeliveryPartnersUnder7Kms(data, order_confirmed_at);
  }

  // Helper: Retrieve the FCM token for the driver
  async getDriverFCMToken(driverId: any) {
    const session: any = await this.model.session.findOne(
      { user_id: new Types.ObjectId(driverId), scope: 'driver' },
      { fcm_token: 1 },
    );
    return session?.fcm_token || null;
  }

  // Helper: Send notification and handle driver status update
  private async sendNotificationAndHandleDriver(data, driver, order, fcmToken) {
    // Get localized message data
    const pushData = await this.preparePushData(driver);
    let datapush = {
      order: order,
      type: 'order_request',
      generated_at: Date.now(),
    };

    this.commonService.send_notification(pushData, fcmToken, datapush);
    await this.updateDriverStatus(driver?._id, true, order?._id);
    // Update order driver requests
    await this.updateOrderDriverRequests(data._id, driver._id);
  }

  // Helper: Prepare push notification data
  private async preparePushData(
    driver,
  ): Promise<{ title: string; description: string }> {
    const [titleKey, descriptionKey] = [
      'send_order_req_title',
      'send_order_req_description',
    ];

    const [titleLocalization, descriptionLocalization] = await Promise.all([
      this.commonService.localization(titleKey),
      this.commonService.localization(descriptionKey),
    ]);

    return {
      title: titleLocalization[driver.preferred_language],
      description: descriptionLocalization[driver.preferred_language],

    };
  }

  // Helper: Update driver status
  async updateDriverStatus(driverId: any, isRideRequestSent: boolean, orderId: any = null) {
    try {
      console.log("update_current_ride_req_id............", driverId);
      let appconfig = await this.model.appConfiguration.findOne({});

      let driver = await this.model.driver.findByIdAndUpdate(
          { _id: driverId },
          {
            currently_send_ride_request: !appconfig.is_fixed_time_delivery ? isRideRequestSent : false,
            currently_send_ride_request_id: orderId,
            currently_send_ride_request_generate_at: isRideRequestSent
              ? Date.now()
              : null,
          },
          {new : true}
        );
       


      return driver; 
    } catch (error) {
      throw error
    }
  }

  private async declineRequestUpdateDriver(
    driverId: any
  ): Promise<void> {
    await this.model.driver.updateOne(
      { _id: driverId },
      {
        currently_send_ride_request: false,
        currently_send_ride_request_id: null,
        currently_send_ride_request_generate_at: Date.now() ?? null,
      },
    );
  }

  // Helper: Update order driver requests
  private async updateOrderDriverRequests(
    orderId: any,
    driverId: any,
  ): Promise<void> {
    const existingNotification = await this.model.orderDriverRequests.findOne({
      order_id: orderId,
    });
    if (existingNotification) {
      existingNotification.driver_ids.push(driverId);
      await existingNotification.save();
    } else {
      await this.model.orderDriverRequests.create({
        order_id: orderId,
        driver_ids: [driverId],
      });
    }
  }

  // Helper: Check the driver's response (accept/decline) within 30 seconds
  private async checkDriverResponse(
    orderId: any,
    driverId: any,
  ): Promise<boolean> {
    for (let i = 0; i < 30; i++) {
      await this.sleep(1000); // Wait for 1 second
      console.log(
        'currently sent noti to this driver.................',
        driverId,
      );

      const response = await this.model.declined_bookings.findOne({
        driver_id: driverId,
        order_id: orderId,
      });
      const order = await this.model.order.findOne({ _id: orderId });

      if (order?.order_status === 'cancelled') {
        return true; // If the order is cancelled, return true to stop further processing
      }

      if (response?.status === 'accepted') {
        return true; // Driver accepted the order
      }

      if (response?.status === 'decline') {
        await this.declineRequestUpdateDriver(driverId);
        return false; // Driver declined the order
      }
    }

    // If no response within 30 seconds, mark as declined
    await this.model.declined_bookings.create({
      order_id: orderId,
      driver_id: driverId,
      status: 'decline',
    });

    await this.declineRequestUpdateDriver(driverId);
    return false;
  }

  // Utility: Sleep function to pause for a specific duration
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async find_order_with_id(id) {
    try {
      const order: any = await this.model.order
        .findOne({ _id: id }, { cart_items: 0 })
        .populate([
          { path: 'restaurant_id' },
          { path: 'customer_id' },
          { path: 'driver_id' },
        ]);
      return order;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async CheckDriverTodayDeclineOrders(driver_id) {
    try {
      const todayStartDay = moment.utc().startOf('day').valueOf();
      const declineOrderCount =
        await this.model.declined_bookings.countDocuments({
          driver_id: driver_id,
          created_at: { $gte: todayStartDay },
        });
      return declineOrderCount;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async ActiveDriverAfterOneHour() {
    try {
      const deactiveDriver = await this.model.driver.find({
        deactivate_at: { $ne: null },
      });
      if (deactiveDriver) {
        for (const driver of deactiveDriver) {
          let current_time = moment.utc().valueOf();
          let addOneHour = moment(driver.deactivate_at)
            .add(1, 'hour')
            .valueOf();
          console.log('addOneHour', addOneHour);

          if (current_time >= addOneHour) {
            const UpdateDriver = await this.model.driver.updateOne(
              { _id: driver._id },
              { is_active: true, deactivate_at: null },
            );
          }
        }
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async autoAcceptOrderAfter31Sec() {
    try {
      const currentTime = moment();

      // console.log('autoAcceptOrder -------   currentTime', currentTime);
      let orders: any = await this.model.order.find({ order_status: OrderStatus.OrderPlaced, payment_status: PaymentStatus.Complete })
        .populate([
          { path: 'customer_id' },
          { path: 'restaurant_id' },
        ]);

      // console.log('autoAcceptOrder -------   orders', orders);

      if (orders && orders.length > 0) {
        for (let order_detail of orders) {
        const createdAtTime = moment(order_detail.order_placed_at);
        const diffInSeconds = currentTime.diff(createdAtTime, 'seconds'); // Calculate the difference in seconds

        if (diffInSeconds > 31) {

          console.log('autoAcceptOrder -------   diffInSeconds', diffInSeconds);

          let update_order = await this.model.order.findOneAndUpdate(
            { _id: order_detail._id },
            {
              order_status: 'order_confirmed',
              is_open_for_driver: true,
              order_confirmed_at: moment.utc().valueOf()
            },
            { new: true });

          // console.log('autoAcceptOrder -------   update_order', update_order);

          let customer = await this.model.customer.findOne({ _id: order_detail.customer_id._id })


          if (update_order.deliver_type == OrderDeliver.Driver && !update_order.is_fixed_time_delivery) {

            // console.log('autoAcceptOrder -------   sendPushToNearestDriversCron', update_order);
            this.sendPushToNearestDriversCron(order_detail, moment.utc().valueOf());
          }

          const title_key = 'order_prepared_title';
          const description_key = 'order_prepared_description';
          const title_localization =
            await this.commonService.localization(title_key);
          const description_localization =
            await this.commonService.localization(description_key);
          let push_content = {
            title: title_localization[customer.preferred_language],
            description: description_localization[customer.preferred_language],
          };
          const session = await this.model.session.find({
            user_id: order_detail.customer_id._id,
          });
          for (const fcm of session) {
            let push_data = {
              order: update_order._id,
              type: 'order_update',
            };


            this.commonService.send_notification(
              push_content,
              fcm.fcm_token,
              push_data,
              order_detail?.customer_id?._id ?? ""
            );
          }
        }
      }







      }

      
    } catch (error) {
      throw error
    }
  }
  async SaveIndexForDragDrop(id, body) {
    try {
      const sortIndex = body.sort_index;
      const categoryId = body.category_id;

      // Step 1: Update sort_index for the dragged item
      await this.model.food.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { sort_index: sortIndex } }
      );

      // Step 2: Increment sort_index of other items in the same category where:

      await this.model.food.updateMany(
        {
          _id: { $ne: new Types.ObjectId(id) },
          category_id: new Types.ObjectId(categoryId),
          sort_index: { $gte: sortIndex },
        },
        { $inc: { sort_index: 1 } }
      );

      return { message: 'Sort index updated successfully' };
    } catch (error) {
      console.error('Error in SaveIndexForDragDrop:', error);
      throw error;
    }
  }
  async SaveIndexForDragDrop1(id, body) {
    try {
      console.log("SaveIndexForDragDrop", id, body);
      console.log("SaveIndexForDragDrop category_id", id, body.category_id);
      await this.model.food.updateOne(
        {
          _id: id
        },
        {
          $set: { sort_index: body.sort_index }
        }
      );

      return { message: 'Sort index updated successfully' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }




  async updateDiscountOnRestaurantItems() {

    let now = new Date(moment.utc().toISOString());

    // add discount on items 
    var restaurants = await this.model.restaurant.find({
      'restaurant_discount.start_time': { $lte: now.getTime() },
      'restaurant_discount.end_time': { $gte: now.getTime() },
      'restaurant_discount_update': false
    });

    restaurants.map(async (restaurant) => {
      let foodItems = await this.model.food.find({ is_deleted: false, restaurant_id: restaurant._id });

      // Create an array of update promises
      const updatePromises = foodItems.map((item) => {
        const discounted_price = item.price * (100 - restaurant.restaurant_discount.discount) / 100;
        return this.model.food.updateOne(
          { _id: item._id },
          {
            $set: {
              discounted_price: discounted_price,
            },
          }
        );
      });
      // Wait for all food item updates to complete
      await Promise.all(updatePromises);
      // Update the restaurant status
      await this.model.restaurant.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            restaurant_discount_update: true,
          },
        }
      );
    });


    // remove discount on items 
    restaurants = await this.model.restaurant.find({
      'restaurant_discount.end_time': { $lte: now.getTime() },
      'restaurant_discount_update': true
    }).populate("vendor_id");
    restaurants.map(async (restaurant, key) => {

      let vendor: any = restaurant.vendor_id;

      await this.model.food.updateMany({ restaurant_id: restaurant._id }, {
        $set: {
          discounted_price: null
        }
      });

      await this.model.restaurant.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            restaurant_discount_update: false,
          },
        }
      );


      // for notification  
      let session = await this.model.session.find({
        user_id: vendor._id,
      });

      if (session.length > 0) {
        for (const fcm of session) {

          const title_key = 'discount_removed_restaurant_title';
          const description_key = 'discount_removed_restaurant_description';

          const title_localization =
            await this.commonService.localization(title_key);
          const description_localization =
            await this.commonService.localization(description_key);
          let push_content = {
            title: title_localization["restaurant.vendor_id.preferred_language"],
            description:
              description_localization[vendor.preferred_language],
          };
          let push_data = {
            type: 'discount_removed_restaurant',
            restaurant_id: restaurant._id,
          };


          this.commonService.send_notification(
            push_content,
            fcm.fcm_token,
            push_data,
            vendor._id
          );
        }
      }

    });
  }

  async handleTrandingFoodItem() {
    await this.model.food.updateMany({}, { $set: { trending_count: 0 } });

  }
}
