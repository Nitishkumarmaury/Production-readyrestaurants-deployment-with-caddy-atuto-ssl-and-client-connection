import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CreateDriverDto, Listing, location, OrderUpdateStatus, payoutListDto, UpdateDriveRequest } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DbService } from 'src/db/db.service';
import { OrderStatus, RiderStatus } from 'src/order/schema/order.schema';
import { CommonService } from 'src/common/common.service';
import * as moment from 'moment';
import { DriverAggregation } from './driver.aggregation';
import { CustomerAggregation } from 'src/customer/customer.aggregation';
import mongoose, { Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { DiverSocket } from "./driver.socket";
import { restaurant_request_list_dto } from 'src/restaurant/dto/restaurant.dto';
import { DriverVerificationStatus } from './schema/driver.schema';
import { ResponseMapper } from '../common/utils/response-mapper.util'; // Import
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
import { LoyaltyPointType } from 'src/loyality-points/entities/loyality-history.entity';
import { WalletTxnType } from 'src/wallet/entities/wallet-transaction.entity';
import { VendorService } from 'src/vendor/vendor.service';
@Injectable()
export class DriverService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly driverAggregation: DriverAggregation,
    private readonly customerAggregation: CustomerAggregation,
    protected diverSocket: DiverSocket,
    private readonly loyaltyService: LoyalityPointsService,
    @Inject(forwardRef(() => VendorService))
    private readonly vendorService: VendorService,
  ) { }
  async find_driver_with_id(id: string) {
    try {
      const driver = await this.model.driver.findOne({ _id: id });
      return driver;
    } catch (error) {
      throw error;
    }
  }

  async goOnline(body, driver_detail) {
    try {

      if (driver_detail.is_approved === true) {
        const updateStatus = await this.model.driver.updateOne(
          { _id: driver_detail._id },
          { status: body.status },
        );
        return { message: 'Status update successfully' };
      } else {
        throw new HttpException(
          {
            error_code: 'under_review',
            error_description: 'Your account is now under reviewed',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async UpdateOrderStatus(body: OrderUpdateStatus, driver_detail: any) {
    try {

        if (body.status === 'accept') {
          // check same time issue 
          
          const currentOrder = await this.model.order.findOneAndUpdate(
          {
            _id: body.order_id,
            $or: [
              { driver_id: null },
              { driver_id: { $exists: false } }
            ]
          },
            {
              $set: {
                driver_id: driver_detail._id,
              }
            },
            { new: true }
          );

          if (!currentOrder) {
            throw new HttpException(
              {
                error_code: 'order_already_accepted',
                error_description: 'Order already accepted by another driver',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        let order: any = await this.model.order
          .findOne({ _id: body.order_id })
          .populate([
            { path: 'restaurant_id' },
            { path: 'customer_id' },
            { path: 'driver_id' },
          ]);


      const restaurant = await this.model.restaurant.findOne({ _id: order.restaurant_id });



      if (body.status === 'accept') {
        console.log("driver accept order =======>> ", driver_detail.email, new Date().toString())
        await this.AcceptOrder(body, driver_detail, order);

        // Clear requests from other drivers for broadcast mode
        const driversInRange = await this.vendorService.findAllDriversInRangeInAcceptOrder(order);

        if (driversInRange && driversInRange.length > 0) {
          const otherDrivers = driversInRange.filter(d => d._id.toString() !== driver_detail._id.toString());         
          console.log("otherDrivers =======>> ", otherDrivers.length);
          await this.vendorService.clearRequestFromDrivers(otherDrivers, order._id);
        }

        // let all_riders = await this.model.driver.find({ _id: { $in: [...order.order_open_for] } }, { socket_id: 1 }, { lean: true })
        let all_riders = await this.model.driver.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(String(restaurant.address.long)), parseFloat(String(restaurant.address.lat))],
              },
              distanceField: "distance",
              maxDistance: 120000 * 1000,
              spherical: true,
            },
          },
          {
            $match: {
              _id: { $in: [...order.order_open_for] }
            }
          },
          {
            $project: {
              socket_id: 1
            }
          }
        ])


        order = await this.model.order
          .findOne({ _id: order._id })
          .populate([
            { path: 'restaurant_id' },
            { path: 'customer_id' },
            { path: 'driver_id' },
          ]);

        await this.diverSocket.socket_data("ride_request_status", order, all_riders);

        // for notification  
        let session = await this.model.session.find({
          user_id: order.customer_id._id ?? null,
        });

        if (session.length > 0) {
          for (const fcm of session) {

            const title_key = 'driver_accept_order_title';
            const description_key = 'driver_accept_order_description';
            const title_localization =
              await this.commonService.localization(title_key);
            const description_localization =
              await this.commonService.localization(description_key);

            let push_content = {
              title: title_localization[order.customer_id.preferred_language],
              description:
                description_localization[order.customer_id.preferred_language],
            };
            let push_data = {
              type: 'order_update',
              order_id: order._id.toString(),
              redirectPath: `/orderDetail?id=${order._id.toString()}`
            };


            this.commonService.send_notification(
              push_content,
              fcm?.fcm_token ?? "",
              push_data,
              order.customer_id?._id ?? ""
            );

          }
        }

      } else if (body.status === 'reject' || body.status === 'decline') {
        await this.model.declined_bookings.findOneAndUpdate(
          { order_id: body.order_id, driver_id: driver_detail._id },
          { status: 'decline' },
          { upsert: true }
        );
        await this.vendorService.clearRequestFromDrivers([driver_detail], body.order_id);

      } else if (body.status === 'reached_at_restaurant') {
        await this.RechedAtRestaurant(body, order);
      } else if (body.status === 'picked_up') {
        await this.PickedUp(body, order);
      } else if (body.status === 'reached_at_delivery') {
        await this.RechedAtDelivery(body, order);
      } else if (body.status === 'delivered') {
        // await this.OrderDelivered(body, order, driver_detail);
        await this.VerifyDeliveryOTP(body, order, driver_detail);
      }

      return { message: 'Successfully update order status' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async AcceptOrder(body, driver_detail, order) {
    try {
      let vendor = await this.model.vendor.findOne({
        _id: order.restaurant_id.vendor_id,
      });

      // check a driver is already accept the order or not 
      // if (order.driver_id) {
      //   throw new HttpException(
      //     {
      //       error_code: 'ORDER_ALREADY_ACCEPTED',
      //       error_description: 'ORDER_ALREADY_ACCEPTED',
      //     },
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      await this.model.order.updateOne(
        { _id: body.order_id },
        {
          rider_status: 'way_to_restaurant', driver_id: driver_detail._id,
          is_open_for_driver: false
        },
      );
      await this.model.driver.updateOne(
        { _id: driver_detail._id },
        { current_order: order._id, ride_status: 'busy' },
      );
      const session = await this.model.session.findOne({
        user_id: order.restaurant_id.vendor_id,
      });
      let key_title = 'delivery_partner_assign_title';
      let key_desc = 'delivery_partner_assign_description';
      let localization_title = await this.commonService.localization(key_title);
      let localization_description =
        await this.commonService.localization(key_desc);
      let push_data = {
        title: localization_title[vendor.preferred_language],
        description: localization_description[vendor.preferred_language],
      };
      let data = {
        order: order._id,
        type: 'order_update',
      };
      this.commonService.send_notification(push_data, session?.fcm_token, data);
      return { message: 'successfully accept order' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async RechedAtRestaurant(body, order) {
    try {
      let vendor = await this.model.vendor.findOne({
        _id: order.restaurant_id.vendor_id,
      });
      const updateOrder = await this.model.order.updateOne(
        { _id: body.order_id },
        { rider_status: RiderStatus.ReachedAtRestaurant },
      );
      const session = await this.model.session.find({
        user_id: order.restaurant_id.vendor_id,
      });
      let key_title = 'delivery_partner_arrived_at_rest_title';
      let key_desc = 'delivery_partner_arrived_at_rest_description';
      let localization_title = await this.commonService.localization(key_title);
      let localization_description = await this.commonService.localization(key_desc);
      let push_data = {
        title: localization_title[vendor.preferred_language],
        description: localization_description[vendor.preferred_language],
      };
      let data = {
        order: order._id,
        order_id: order._id,
        type: 'order_update',
        redirectPath: `orderDetail?id=${order._id}`
      };
      const fcmTokens = session.map(s => s.fcm_token).filter(Boolean);
      this.commonService.send_bulk_notifications(push_data, fcmTokens, data);
      await this.model.NotificationModel.create({
        notification: {
          title: localization_title[vendor.preferred_language],
          body: localization_description[vendor.preferred_language],
        },
        data: data,
        userId: order.restaurant_id.vendor_id,
        resturantId: order.restaurant_id._id,
        isCustomer: false,
        isVendor: true,
        isDriver: false,
        isRead: false,
        isDeleted: false,
      });
      return { message: 'successfully reached at restaurant' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async PickedUp(body, order) {
    try {
      let vendor = await this.model.vendor.findOne({
        _id: order.restaurant_id.vendor_id,
      });
      if (!order.order_ready_at) {
        throw new HttpException(
          {
            error_code: 'ORDER_NOT_READY',
            error_description: 'ORDER_NOT_READY',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.model.order.updateOne(
        { _id: body.order_id },
        {
          order_status: RiderStatus.PickedUp,
          rider_status: RiderStatus.PickedUp,
          order_picked_up_at: moment.utc().valueOf(),
        },
      );
      const session = await this.model.session.find({
        user_id: order?.customer_id?._id,
      });
      let key_title = 'driver_picked_up_title';
      let key_desc = 'driver_picked_up_description';
      let localization_title = await this.commonService.localization(key_title);
      let localization_description = await this.commonService.localization(key_desc);
      let push_data = {
        title: localization_title[vendor.preferred_language],
        description: localization_description[vendor.preferred_language],
      };
      let data = {
        order: order._id,
        order_id: order._id,
        type: 'order_update',
        redirectPath: `orderDetail?id=${order._id}`
      };
      const fcmTokens = session.map(s => s.fcm_token).filter(Boolean);
      this.commonService.send_bulk_notifications(push_data, fcmTokens, data);
      await this.model.NotificationModel.create({
        notification: {
          title: localization_title[vendor.preferred_language],
          body: localization_description[vendor.preferred_language],
        },
        data: data,
        userId: order?.customer_id?._id,
        resturantId: order.restaurant_id._id,
        isCustomer: true,
        isVendor: false,
        isDriver: false,
        isRead: false,
        isDeleted: false,
      });
      return { message: 'successfully picked up ' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async RechedAtDelivery(body, order) {
    try {
      let vendor = await this.model.vendor.findOne({
        _id: order.restaurant_id.vendor_id,
      });
      await this.model.order.updateOne(
        { _id: body.order_id },
        { rider_status: RiderStatus.ReachedAtdelivery },
      );
      const session = await this.model.session.find({
        user_id: order.customer_id,
      });
      let key_title = 'driver_reached_at_delivery_title';
      let key_desc = 'driver_reached_at_delivery_description';
      let localization_title = await this.commonService.localization(key_title);
      let localization_description = await this.commonService.localization(key_desc);
      let push_data = {
        title: localization_title[vendor.preferred_language],
        description: localization_description[vendor.preferred_language],
      };
      let data = {
        order: order._id,
        order_id: order._id,
        type: 'order_update',
        redirectPath: `orderDetail?id=${order._id}`
      };
      const fcmTokens = session.map(s => s.fcm_token).filter(Boolean);
      this.commonService.send_bulk_notifications(push_data, fcmTokens, data);
      await this.model.NotificationModel.create({
        notification: {
          title: localization_title[vendor.preferred_language],
          body: localization_description[vendor.preferred_language],
        },
        data: data,
        userId: order?.customer_id?._id,
        resturantId: order.restaurant_id._id,
        isCustomer: true,
        isVendor: false,
        isDriver: false,
        isRead: false,
        isDeleted: false,
      });
      return { message: 'successfully reached at delivery location. ' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async OrderDelivered(body, order, driver_detail) {
    try {
      console.log('ORDER STATUS (OrderDelivered) : ', body.status)
      let vendor = await this.model.vendor.findOne({
        _id: order.restaurant_id.vendor_id,
      });
      await this.model.order.updateOne(
        { _id: body.order_id },
        {
          rider_status: RiderStatus.Delivered,
          order_status: OrderStatus.Delivered,
          order_delivered_at: moment.utc().valueOf(),
        },
      );

      await this.model.restaurant.findByIdAndUpdate(
        order.restaurant_id,
        { $inc: { total_orders: 1 } }
      );


      if (order.cart_items.length > 0) {
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


      await this.model.driver.updateOne(
        { _id: driver_detail._id },
        { current_order: null, ride_status: 'free' },
      );
      await this.model.earnings.updateOne(
        { order_id: body.order_id },
        {
          driver_id: driver_detail._id,
        },
      );

      // increase order count on food 
      if (order.cart_items.length > 0) {
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


      const session = await this.model.session.find({
        user_id: order?.customer_id?._id,
      });

      let key_title = 'order_delivered_title';
      let key_desc = 'order_delivered_description';
      let localization_title = await this.commonService.localization(key_title);
      let localization_description = await this.commonService.localization(key_desc);
      let push_data = {
        title: localization_title[vendor.preferred_language],
        description: localization_description[vendor.preferred_language],
      };
      let data = {
        order: order._id,
        order_id: order._id,
        type: 'order_update',
        redirectPath: `summary?id=${order._id}`
      };
      const fcmTokens = session.map(s => s.fcm_token).filter(Boolean);
      this.commonService.send_bulk_notifications(push_data, fcmTokens, data);
      await this.model.NotificationModel.create({
        notification: {
          title: localization_title[vendor.preferred_language],
          body: localization_description[vendor.preferred_language],
        },
        data: data,
        userId: order?.customer_id?._id,
        resturantId: order.restaurant_id._id,
        isCustomer: true,
        isVendor: false,
        isDriver: false,
        isRead: false,
        isDeleted: false,
      });
      return { message: 'successfully order delivered. ' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async VerifyDeliveryOTP(body, order, driver_detail) {
    if (!order) {
      throw new HttpException(
        {
          error_code: 'Invalid OTP',
          error_description: 'Order not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if(!order.is_fixed_time_delivery){

        if (!order.delivery_otp) {
          throw new HttpException(
            {
              error_code: 'Invalid OTP',
              error_description: 'OTP not sent',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        const isMatch = body.otp == order.delivery_otp;

        if (!isMatch) {
          throw new HttpException(
            {
              error_code: 'Invalid OTP',
              error_description: 'Invalid OTP',
            },
            HttpStatus.BAD_REQUEST,
          );
        }



    }


    



    // OTP matches, mark order as delivered
    await this.OrderDelivered(body, order, driver_detail);

    // create order earning 
    await this.commonService.createOrderEarning(order);

    // return await this.OrderDelivered(body, order, { _id: order.driver_id });
  }

  async FindAllwithStatus(body, user) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);
      let data_to_aggregate;
      if (body.status === 'active') {
        data_to_aggregate = [
          await this.driverAggregation._drivermatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      } else if (body.status === 'inactive') {
        data_to_aggregate = [
          await this.driverAggregation.InActiveDriverMatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      } else if (body.status === 'block') {
        data_to_aggregate = [
          await this.driverAggregation.Blockdrivermatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      } else if (body.status === 'deleted') {
        data_to_aggregate = [
          await this.driverAggregation.Deleteddrivermatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      } else if (body.status === 'expired') {
        data_to_aggregate = [
          await this.driverAggregation.Expireddrivermatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      } else if (body.status === 'pending') {
        data_to_aggregate = [
          await this.driverAggregation.Pendingdrivermatch(),
          await this.driverAggregation.order_count_lookup(),
          await this.driverAggregation.AddField(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.projectFields(),
          await this.driverAggregation.face_set(options),
        ];
      }



      
      const data: any = await this.model.driver.aggregate(data_to_aggregate);
      // Mask sensitive fields here
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map(item =>
          isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item
        )
        : [];



      let [result] = await this.model.earnings.aggregate([
        {
          $group: {
            _id: null,
            commission_from_driver: { $sum: "$commission_from_driver" },
          },
        },
      ]);

      return { count: data[0]?.count[0]?.count, total_driver_earnings: result?.commission_from_driver || 0, data: maskedData };

      //return { count: data[0]?.count[0]?.count || 0, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driver_details(id: any, user) {
    try {
      let data_to_aggregate = [
        await this.driverAggregation.match(id),
        await this.driverAggregation.DriverBankLookup(),
        await this.driverAggregation.total_payout_lookup(),
        await this.driverAggregation.total_payout_AddField(),
        await this.driverAggregation.upcoming_payout_lookup(),
        await this.driverAggregation.DriverVhicalLookup(),
        await this.driverAggregation.UnwindVehicalLookup(),
        await this.driverAggregation.upcoming_payout_AddField(),
        await this.driverAggregation.total_payout_AddField(),
        await this.driverAggregation.driverprojectFields(),
      ];

      const driverData = await this.model.driver.aggregate(data_to_aggregate);
      const isSubadmin = user.scope === 'subadmin';

      if (driverData[0] && isSubadmin) {
        driverData[0] = ResponseMapper.maskSensitiveFields(driverData[0]);
      }
      const ratings = await this.model.review.find({ restaurant_id: id }).sort({ _id: -1 }).limit(5);
      driverData[0].ratings = ratings;

      const delete_reason = await this.model.ReportReasonModel.findById(driverData[0].delete_reason);
      driverData[0].delete_reason = delete_reason?.reason ?? "";


      const total_reports = await this.model.reports.countDocuments({ driver_id: new Types.ObjectId(id) });
      driverData[0].total_reports = total_reports;

      return { data: driverData[0] };


    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driverOrderList(body) {
    let options = await this.commonService.set_options(body.page, body.limit);
    try {
      let data_to_aggregate = [
        await this.customerAggregation.driver_match(body.driver_id),
        await this.customerAggregation.customer_lookup(),
        await this.customerAggregation.driver_lookup(),
        await this.customerAggregation.restaurant_lookup(),
        await this.customerAggregation.unwind__restaurantdata(),
        await this.customerAggregation.unwind__customerdata(),
        await this.customerAggregation.unwind_driverdata(),


        await this.customerAggregation.lookupOrderEarning(),


        {
          $addFields: {
            total_earning: {
              $sum: {
                $map: {
                  input: "$earnings",
                  as: "e",
                  in: {
                    $subtract: [
                      {
                        $add: [
                          { $ifNull: ["$$e.commission_from_restaurant", 0] },
                          { $ifNull: ["$$e.commission_from_driver", 0] }
                        ]
                      },
                      { $ifNull: ["$$e.coupon_amount", 0] }
                    ]
                  }
                }
              }
            }

          },
        },


        await this.customerAggregation.OrderProject(),
        await this.customerAggregation.face_set(options),
      ];
      const data = await this.model.order.aggregate(data_to_aggregate);

      let total_order_earning = data[0]?.total_order_earning[0]?.total_earning || 0; 


      return { count: data[0]?.count[0]?.count, total_order_earning: total_order_earning, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async payoutList(body: payoutListDto) {
    let options = await this.commonService.set_options(body.page, body.limit);

    try {
      const match: any = { status: 'success' };
      if (body.driver_id) match.driver_id = new mongoose.Types.ObjectId(body.driver_id);
      if (body.restaurant_id) match.restaurant_id = new mongoose.Types.ObjectId(body.restaurant_id);

      const pipeline: any = [
        { $match: match },
        {
          $project: {
            _id: 1,
            type: 1,
            driver_id: 1,
            restaurant_id: 1,
            amount: 1,
            status: 1,
            payout_week_start: 1,
            payout_week_end: 1,
            invoice_url: 1,
            createdAt: 1,
          },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: options.skip },
              { $limit: options.limit },
            ],
            count: [{ $count: 'count' }],
          },
        },
      ];

      const data = await this.model.PayoutModel.aggregate(pipeline);

      return {
        count: data[0]?.count[0]?.count || 0,
        data: data[0]?.data || [],
      };
    } catch (error) {
      console.error('Error in payoutList:', error);
      throw error;
    }
  }

  async FindDriverRequests(body) {
    try {
      let data_to_aggregate;
      let options = await this.commonService.set_options(body.page, body.limit);
      if (body.status === 'pending') {
        data_to_aggregate = [
          await this.driverAggregation._driverRequestmatch(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.driverRequestprojectFields(),
          await this.driverAggregation.face_set(options),
        ];
      }
      if (body.status === 'reject') {
        data_to_aggregate = [
          await this.driverAggregation._driverRequestRejectmatch(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.driverRequestprojectFields(),
          await this.driverAggregation.face_set(options),
        ];
      }
      const data: any = await this.model.driver.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async FindDriverRequestsNew(body) {
    try {
      let data_to_aggregate;
      let options = await this.commonService.set_options(body.page, body.limit);

      let query;

      if (body.type === 'requested') {
        query = {
          verification: body.status,
          is_deleted: false,
        };

      } else if (body.type === 'updated') {
        query = {
          doc_update_verification: body.status,
          is_deleted: false,
        };
      }


      if (body.status === 'pending') {
        data_to_aggregate = [
          await this.driverAggregation._driverRequestmatch(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.driverRequestprojectFields(),
          await this.driverAggregation.face_set(options),
        ];
      }
      if (body.status === 'reject') {
        data_to_aggregate = [
          await this.driverAggregation._driverRequestRejectmatch(),
          await this.driverAggregation.fillter_data(body.search),
          await this.driverAggregation.driverRequestprojectFields(),
          await this.driverAggregation.face_set(options),
        ];
      }
      const data: any = await this.model.driver.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async FindDriverUpdateRequests(body) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);

      let data_to_aggregate = [
        await this.driverAggregation._driverUpdateRequestmatch(),
        await this.driverAggregation.fillter_data(body.search),
        await this.driverAggregation.driverRequestprojectFields(),
        await this.driverAggregation.face_set(options),
      ];
      const data: any = await this.model.driver.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async driver_list_all(body: restaurant_request_list_dto) {
    try {
      const { page, limit, search = "", type } = body;
      const options = await this.commonService.set_options(page, limit);

      let query = {};
      let searchQuery = {};

      if (search) {
        searchQuery = {
          $or: [
            { restaurant_name: { $regex: search, $options: 'i' } },
            { restaurant_phone: { $regex: search, $options: 'i' } }
          ],
        };
      }

      if (type === 'requested') {
        query = {
          verification: status
        };

      } else if (type === 'updated') {
        query = {
          doc_update_verification: status
        };
      }

      const data_to_aggregate = [
        await this.driverAggregation._driverUpdateRequestmatch(),
        await this.driverAggregation.fillter_data(search),
        await this.driverAggregation.driverRequestprojectFields(),
        await this.driverAggregation.face_set(options),
      ];
      const data: any = await this.model.driver.aggregate(data_to_aggregate);

      return {
        count: data?.[0]?.count?.[0]?.count || 0,
        data: data?.[0]?.data || [],
      };
    } catch (error) {
      throw error;
    }
  }

  async SetExpiryDate(body, id) {
    try {

      await this.model.driver.updateOne(
        { _id: new Types.ObjectId(id) },
        { licence_expiry_date: body.licence_expiry_date },
      );
      return { message: 'successfully set dates' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async block(body) {
    try {
      const user = await this.model.driver.findOne({
        _id: new mongoose.Types.ObjectId(body.driver_id),
      });
      let query = {};
      if (body.status === 'block') {
        if (!body.reason) {
          throw new HttpException(
            {
              error_code: 'PLEASE_ENTER_REASON',
              error_description: 'Please enter reason',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        query = { is_block: true };
        await this.model.driver.updateOne({ _id: body.driver_id }, query);
        await this.commonService.SentEmailForBlockAccount(user, body);
        await this.model.session.deleteMany({ user_id: new mongoose.Types.ObjectId(body.driver_id) });
        query = { is_block: true, block_reason: body.reason };
      } else if (body.status === 'unblock') {
        query = { is_block: false };
        await this.commonService.SentEmailForUnBlockAccount(user, body);
      }
      await this.model.driver.updateOne({ _id: body.driver_id }, query);
      return { message: 'Status update successfully' };
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }

  async UpdateRequest(_id: string, body: UpdateDriveRequest) {
    try {
      const driverIdToUse = body.driver_id || _id;

      let driver = await this.model.driver.findOne({ _id: driverIdToUse });

      let session = await this.model.session.findOne(
        { user_id: driverIdToUse },
        { fcm_token: 1 },
      );

      const { is_update, status, reason } = body;
      const updateData: any = { is_docs_update: is_update ? true : false };

      if (status === 'decline' || status === 'reject') {
        if (is_update === false) {
          updateData.verification = DriverVerificationStatus.REJECTED;
          updateData.doc_update_verification = DriverVerificationStatus.REJECTED;
        } else {
          updateData.doc_update_verification = DriverVerificationStatus.REJECTED;
          updateData.verification =
            driver.verification === DriverVerificationStatus.APPROVED
              ? DriverVerificationStatus.APPROVED
              : driver.verification;
        }

        updateData.is_approved = false;
        updateData.reject_reason = reason;

        let user = await this.model.driver.findOneAndUpdate(
          { _id: driverIdToUse },
          updateData,
          { new: true },
        );
        console.log('In case of reject user', user);

        if (session) {
          let title_key = 'admin';
          let description_key = 'reject_driver_description';
          let localization_title = await this.commonService.localization(title_key);
          let localization_description = await this.commonService.localization(description_key);
          let push_data = {
            title: localization_title[user.preferred_language],
            description: localization_description[user.preferred_language],
          };
          let data = { type: 'admin' };

          this.commonService.send_notification(push_data, session?.fcm_token, data);
        }

        await this.sent_email_to_driver_for_reject_request(user, body);
      } else {

        // check  expiry date conditon 

        let documents = await this.model.UplodedDocumentModel.find({ driver_id: driver._id }).populate("requirement_id");

        let flag = true;
        for (const document of documents) {
          let req: any = document.requirement_id;

          if (req.is_expiry === true) {
            if (document.expiry_date === null) {
              flag = false; // Stops here and returns false
            }
          }
        }

        if (!flag) {
          throw new BadRequestException('please add expire date');
        }

        updateData.is_active = true;
        updateData.is_docs_update = true;
        updateData.doc_update_verification = DriverVerificationStatus.APPROVED;
        updateData.verification = DriverVerificationStatus.APPROVED;

        updateData.docs_approved_on = moment.utc().valueOf();
        updateData.is_approved = true;

        console.log('In case of accept updateData', updateData);

        let user = await this.model.driver.findOneAndUpdate(
          { _id: driverIdToUse },
          updateData,
          { new: true },
        );

        console.log('In case of accept user', user);

        if (session) {
          let title_key = 'admin';
          let description_key = 'accept_driver_description';
          let localization_title = await this.commonService.localization(title_key);
          let localization_description = await this.commonService.localization(description_key);
          let push_data = {
            title: localization_title[user.preferred_language],
            description: localization_description[user.preferred_language],
          };
          let data = { type: 'admin' };

          this.commonService.send_notification(push_data, session?.fcm_token, data);
        }

        await this.sent_email_to_driver_for_approve_request(user);
      }

      return { message: "Driver's account has been approved successfully" };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async sent_email_to_driver_for_approve_request(user) {
    try {
      let file_path = path.join(
        __dirname,
        '../../dist/emails/approve-docs.hbs',
      );
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        driverName: user?.name || 'driver',
      };
      const htmlToSend = template(data);

      let mailData = {
        to: user.email,
        subject: `Your Account Has Been Approved`,
        html: htmlToSend,
      };
      this.commonService.sendmail(
        mailData.to,
        mailData.subject,
        null,
        mailData.html,
      );
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async sent_email_to_driver_for_reject_request(user, body) {
    try {
      let file_path = path.join(__dirname, '../../dist/emails/reject-docs.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        driverName: user.name,
        reason: body.reason,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: user.email,
        subject: `Your Account Has Been Rejected`,
        html: htmlToSend,
      };
      this.commonService.sendmail(
        mailData.to,
        mailData.subject,
        null,
        mailData.html,
      );
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driverEarningsForAdmin(body) {
    try {
    } catch (error) {
      throw error;
    }
  }

  async orderList(body) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);
      let query = {};
      body.status === 'past'
        ? (query = {
          order_status: { $in: ['delivered', 'cancelled'] },
          driver_id: new mongoose.Types.ObjectId(body.driver_id),
        })
        : null;
      body.status === 'current'
        ? (query = {
          order_status: { $nin: ['delivered', 'cancelled'] },
          driver_id: new mongoose.Types.ObjectId(body.driver_id),
        })
        : null;

      let data_to_aggregate = [
        await this.driverAggregation.drivermatch(query),
        await this.driverAggregation.RestaurantLookup(),
        await this.driverAggregation.UnwindRestaurantLookup(),
        await this.driverAggregation.project(),
        await this.driverAggregation.face_set(options),
      ];
      let data = await this.model.order.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async openOrders(driver_detail, dto: Listing) {
    try {
      let options = await this.commonService.set_options(dto.page, dto.limit);
      let query : any = {}
      
      let appconfig = await this.model.appConfiguration.findOne();
      if(appconfig.is_fixed_time_delivery){
        query = {
          driver_id: { $in: [driver_detail?._id] },
          is_fixed_time_delivery: true,
          order_status: { $nin: ['delivered', 'cancelled'] },
        }
      }else {
        query = {
          is_open_for_driver: true, order_open_for: { $in: [driver_detail?._id] },
          order_status: { $nin: ['delivered', 'cancelled'] },
          is_fixed_time_delivery: false,
        }      
      }      




      let projection = { __v: 0, order_open_for: 0, is_open_for_driver: 0, }
      let option = { limit: options.limit, skip: options.skip, lean: true, sort: { _id: -1 } }
      
      console.log("query === >>>>>> ", query)


      let orders = await this.model.order.find(query, projection, option)
        .populate([
          { path: 'customer_id' },
          { path: 'restaurant_id' }
        ]);

      let count = await this.model.order.countDocuments(query);

      return { count: count, data: orders }
    } catch (error) {
      throw error
    }
  }

  async updateLocation(dto: location, user) {
    try {
      let query = { _id: user._id }
      let update = {
        latitude: dto.latitude,
        longitude: dto.longitude,
        location: {
          type: 'Point',
          coordinates: [parseFloat(dto.longitude), parseFloat(dto.latitude)], // Convert to numbers
        },
      }
      let option = { new: true }
      await this.model.driver.findByIdAndUpdate(query, update, option);
      return { message: "Location updated Successfully." }
    } catch (error) {
      throw error
    }
  }
  async getDriver_docs_list_all(body: restaurant_request_list_dto, user) {
    try {

      const { page, limit, search, type , status } = body;
      const options = await this.commonService.set_options(page, limit);

      let query : any = {};
      let searchQuery = {};

      // Search filter
      if (search) {
        searchQuery = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ],
        };
      }
      if (type === 'requested') {
        query = {
          is_approved: false, is_docs_update: true, set_up_profile: true,
          verification: status,
          is_deleted: false,
        };

      } else if (type === 'updated') {
        query = {
          is_approved: false, is_docs_update: true, set_up_profile: true,
          // doc_update_verification: status,
          is_deleted: false,
        };


        if(status === DriverVerificationStatus.REJECTED){
          query.doc_update_verification = status;
        }


      }


      const data_to_aggregate = [
        await this.driverAggregation._driverUpdateRequestmatchStatus(query),
        await this.driverAggregation.fillter_data(body.search),
        await this.driverAggregation.driverRequestprojectFields(),
        await this.driverAggregation.face_set(options),
      ];

      let data = await this.model.driver.aggregate(data_to_aggregate);
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map(item =>
          isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item
        )
        : [];
      return { count: data[0]?.count[0]?.count, data: maskedData };
    } catch (error) {
      throw error;
    }
  }

  async getAvaliableDrivers(restaurant_id: string, search = "") {
    try {
      const restaurant = await this.model.restaurant.findOne(
        { _id: new Types.ObjectId(restaurant_id) },
        { address: 1 },
        { lean: true }
      );

      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                parseFloat(String(restaurant.address.long)),
                parseFloat(String(restaurant.address.lat)),
              ],
            },
            distanceField: "distance",
            maxDistance: 12000,
            spherical: true,
          },
        },
        {
          $match: {
            is_active: true,
            is_approved: true,
            is_deleted: false,
            is_block: false,
            ride_status: "free",
          },
        },
      ];

      if (search) {
        pipeline.push({
          $match: {
            name: { $regex: search, $options: "i" },
          },
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          status: 1,
          distance: 1,
        },
      });

      const drivers = await this.model.driver.aggregate(pipeline);

      return { message: "Driver found successfully.", data: drivers };
    } catch (error) {
      throw error;
    }
  }

  // async check_Expiry_date() {
  //   try {
  //     const current_date = moment.utc().startOf('day').utcOffset('+0530').valueOf();

  //     const drivers = await this.model.driver.find({ is_active: true, is_approved: true });

  //     for (const driver of drivers) {

  //       if (current_date > driver.licence_expiry_date) {

  //         const updateData: Record<string, any> = {
  //           is_approved: false, is_deleted: false, is_block: false,
  //           status: 'offline',
  //           is_docs_update: true,
  //           doc_expiry_type: 'licence_expired',
  //         };

  //         updateData.doc_update_verification =
  //           driver.verification === DriverVerificationStatus.NULL;

  //         updateData.verification =
  //           driver.verification === DriverVerificationStatus.REJECTED
  //             ? DriverVerificationStatus.SUBMITTED
  //             : driver.verification;

  //         updateData.licence_expiry_date = null;

  //         await this.model.driver.updateOne({ _id: driver._id }, updateData);

  //         const session = await this.model.session.findOne({ user_id: driver._id });
  //         if (session?.fcm_token) {
  //           this.commonService.send_notification(
  //             {
  //               title: 'Licence Expired',
  //               description: 'Your account has been set to inactive due to an expired licence. Please update your licence to reactivate your account.',
  //             },
  //             session.fcm_token,
  //             { type: 'document_expiration' }
  //           );
  //         }

  //         await this.sent_docs_expire_email(driver);
  //       } else {
  //         //console.log(`Licence valid for driver: ${driver.name}`);
  //       }
  //     }

  //   } catch (error) {
  //     console.log('error', error);
  //     throw error;
  //   }
  // }


  async sent_docs_expire_email(user) {
    try {
      let file_path = path.join(
        __dirname,
        '../../dist/emails/docs-expired.hbs',
      );
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        driverName: user?.name || 'driver',
      };
      const htmlToSend = template(data);

      let mailData = {
        to: user.email,
        subject: `Action Required: Your Account is Inactive Due to Expired Documents`,
        html: htmlToSend,
      };
      this.commonService.sendmail(
        mailData.to,
        mailData.subject,
        null,
        mailData.html,
      );
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }









}
