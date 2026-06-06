import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as moment from 'moment-timezone';

import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { v4 as uuidv4 } from 'uuid';
import { OrderAggregation } from './order.aggregation';
import { PaymentService } from 'src/payment/payment.service';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { AppService } from 'src/app.service';
import {
  OrderPlacedDto,
  orderSubscriptionsListDto,
  orderSubscriptionsStatusDto,
  OrderSubscriptionStatus,
  OrderSubscriptionType,
  recent_order_list,
  RefundDto,
  Status,
} from './dto/order.dto';
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentType,
  RiderStatus,
} from './schema/order.schema';
import mongoose, { Types } from 'mongoose';
import * as dayjs from 'dayjs';
import { HeatMapQueryDto } from './dto/heat-map-query.dto';
import {
  DebitType,
  WalletTxnCreditType,
  WalletTxnType,
} from 'src/wallet/entities/wallet-transaction.entity';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { PaymentGateway } from 'src/configuration/dto/update-configuration.dto';
import { CommissionForRestaurantBy } from 'src/configuration/schema/app-configuration.schema';
import { UsersType } from 'src/auth/role/user.role';
import { app, messaging } from 'firebase-admin';
import { notContains } from 'class-validator';
import { payment_type } from 'src/payment/schema/payment.schema';
import { LoyaltyPointType } from 'src/loyality-points/entities/loyality-history.entity';
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
@Injectable()
export class OrderService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly orderAggregation: OrderAggregation,
    private readonly paymentService: PaymentService,
    private readonly appService: AppService,
    private readonly RazorpayService: RazorpayService,
    private readonly loyaltyService: LoyalityPointsService,
  ) {}

  async RestaurantDetail(restaurant_id, body, customer_detail?) {
    try {
      const restaurant = await this.model.restaurant
        .findOne({
          _id: restaurant_id,
        })
        .populate([
          { path: 'services', select: 'name image' },
          { path: 'amenities', select: 'name' },
        ]);

      console.log('restaurant', restaurant);
      let check_category = await this.model.food
        .find(
          { restaurant_id: restaurant._id, is_deleted: false },
          { category_id: 1 },
        )
        .populate([{ path: 'category_id' }]);

      let uniqueCategories = Array.from(
        new Set(
          check_category
            .filter((food) => food.category_id) // filter out deleted categories
            .map((food) => food.category_id),
        ),
      );

      let category = await this.model.category.find({
        _id: { $in: uniqueCategories },
      });
      console.log('check category,,....', category);

      const RestaurantOffer = await this.model.coupon.find({
        restaurant_id: restaurant_id,
        status: 'active',
      });
      const CustomerCurrentLoc = await this.model.customerAddress.findOne({
        _id: customer_detail?.current_address,
      });
      let is_fav = false;
      if (customer_detail?.user_id) {
        const fav = await this.model.favourite.findOne({
          customer_id: new Types.ObjectId(customer_detail.user_id),
          restaurant_id: new Types.ObjectId(restaurant._id),
        });
        is_fav = !!fav;
      }
      //const CustomerCurrentLoc = await this.model.customerAddress.findOne({
      //  _id: customer_detail?.current_address,
      //});
      console.log('body', body);
      console.log('customer_detail', customer_detail);
      console.log(
        'customer_detail?.current_address',
        customer_detail?.current_address,
      );
      console.log('CustomerCurrentLoc', CustomerCurrentLoc);
      console.log('CustomerCurrentLoc?.lat', CustomerCurrentLoc?.lat);
      console.log('CustomerCurrentLoc?.long', CustomerCurrentLoc?.long);
      console.log('restaurant.address?.lat', restaurant.address?.lat);
      console.log('restaurant.address?.long', restaurant.address?.long);
      let DistanceAndDuration;
      if (body) {
        DistanceAndDuration = await this.commonService.CalculateDistance(
          body?.lat || 0,
          body?.long || 0,
          restaurant.address?.lat || 0,
          restaurant.address?.long || 0,
        );
      }
      let rating_count = await this.model.review.countDocuments({
        restaurant_id: restaurant._id,
      });
      const restaurantWithCategories = {
        ...restaurant.toObject(),
        category,
        rating_count, // Add the categories directly inside the restaurant object
        is_fav,
      };
      return {
        data: restaurantWithCategories,
        offers: RestaurantOffer,
        // category:category,
        distance: DistanceAndDuration?.distance || 0,
        duration: DistanceAndDuration?.duration || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  async RestaurantMenu(restaurant_id: string, body, req: any) {
    try {
      const customer_id = req?.user?._id ?? null;

      const baseMatch: any = {
        is_deleted: false,
        // restaurant_id: new Types.ObjectId(restaurant_id),
      };

      if (body.rating_4plus === 'true') {
        baseMatch.rating = { $gte: 4 };
      }

      if (body.veg === 'true') {
        baseMatch.food_type = 'veg';
      } else if (body.non_veg === 'true') {
        baseMatch.food_type = { $in: ['non_veg', 'egg'] };
      }

      if (body.catering_services === 'true') {
        baseMatch.catering_services = true;
      } else if (body.catering_services === 'false') {
        baseMatch.catering_services = false;
      }

      /** ---------------- Restaurant Info ---------------- */
      const restaurant = await this.model.restaurant
        .findById(restaurant_id)
        .select(
          'is_delivery_available delivery_price_per_km delivery_range_in_km is_custom_menu',
        )
        .lean();

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found!');
      }

      baseMatch.restaurant_id = null;
      if (restaurant && restaurant.is_custom_menu) {
        baseMatch.restaurant_id = restaurant._id;
      }

      const appConfigDetails = await this.model.appConfiguration
        .findOne()
        .select('deliveryFeeOptions')
        .lean();

      restaurant['deliveryFeeOptions'] =
        appConfigDetails?.deliveryFeeOptions ?? null;

      /** ---------------- Favourite Foods ---------------- */
      const favFoods = await this.model.favourite
        .find({ customer_id, food_item_id: { $ne: null } }, { food_item_id: 1 })
        .lean();

      const favFoodIds = new Set(
        favFoods.map((f) => f.food_item_id.toString()),
      );

      /** ---------------- Search ---------------- */
      const searchMatch = body.search
        ? {
            $match: {
              $or: [
                { name: { $regex: body.search, $options: 'i' } },
                { description: { $regex: body.search, $options: 'i' } },
                {
                  'category.category_name': {
                    $regex: body.search,
                    $options: 'i',
                  },
                },
              ],
            },
          }
        : null;

      const smartSearchMatch = body.search
        ? {
            $search: {
              index: 'default',
              compound: {
                should: [
                  {
                    autocomplete: {
                      query: body.search,
                      path: 'name',
                      fuzzy: { maxEdits: 2 },
                    },
                  },
                  {
                    text: {
                      query: body.search,
                      path: ['name', 'description'],
                      fuzzy: { maxEdits: 2 },
                    },
                  },
                ],
              },
            },
          }
        : null;

      /** ---------------- Category-wise Foods ---------------- */
      const aggregationPipeline: any[] = [];

      if (smartSearchMatch) aggregationPipeline.push(smartSearchMatch);

      aggregationPipeline.push(
        { $match: baseMatch },
        {
          $addFields: {
            _sort: {
              $cond: {
                if: { $ne: ['$sort_index', null] },
                then: '$sort_index',
                else: '$created_at',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'categories',
            let: { categoryId: '$category_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$categoryId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  category_name: 1,
                },
              },
            ],
            as: 'category',
          },
        },
        { $unwind: '$category' },
        { $sort: { _sort: 1 } },
        { $project: { _sort: 0 } },
        {
          $group: {
            _id: '$category._id',
            category_name: { $first: '$category.category_name' },
            food_items: { $push: '$$ROOT' },
          },
        },
        { $sort: { category_name: 1 } },
      );

      const foodByCategory =
        await this.model.food.aggregate(aggregationPipeline);

      /** ---------------- Recommended Foods ---------------- */
      const recommendedFoods = await this.model.food.aggregate([
        {
          $match: {
            ...baseMatch,

            is_recommend: true,
          },
        },
        {
          $lookup: {
            from: 'categories',
            let: { categoryId: '$category_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$categoryId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  category_name: 1,
                },
              },
            ],
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        ...(searchMatch ? [searchMatch] : []),
      ]);

      /** ---------------- Remove Duplicate Recommended Items ---------------- */
      const recommendedFoodIds = new Set(
        recommendedFoods.map((item) => item._id.toString()),
      );

      for (const category of foodByCategory) {
        category.food_items = category.food_items
          .filter((item) => !recommendedFoodIds.has(item._id.toString()))
          .map((item) => ({
            ...item,
            is_fav: favFoodIds.has(item._id.toString()),
          }));
      }

      /** ---------------- Add Recommended Section ---------------- */
      if (recommendedFoods.length > 0) {
        foodByCategory.unshift({
          category_name: 'Recommended',
          food_items: recommendedFoods.map((item) => ({
            ...item,
            is_fav: favFoodIds.has(item._id.toString()),
          })),
        });
      }

      return {
        data: foodByCategory,
        restaurant,
      };
    } catch (error) {
      throw error;
    }
  }

  async SearchRestaurantDish(restaurant_id, search) {
    try {
      const food = await this.model.food.find({
        is_deleted: false,
        restaurant_id: restaurant_id,
        name: { $regex: search, $options: 'i' },
      });
      return { data: food };
    } catch (error) {
      throw error;
    }
  }

  async AvailableCoupon(restaurant_id: string, search = '', req: any) {
    try {
      let customer_id = req?.payload?.user_id ?? null;

      const query: any = {
        $or: [{ restaurant_id }, { restaurant_id: null }],
        status: 'active',
        type: 'in-app',
      };

      if (search) {
        query.code = { $regex: search, $options: 'i' };
      }

      const coupons = await this.model.coupon.find(query);
      return { data: coupons };
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      throw error;
    }
  }

  async isRestaurantOpen(schedule) {
    // current time (IST better rahega agar India use case hai)
    const now = moment().utcOffset(330); // IST
    const currentDayId = now.isoWeekday().toString();

    const todaySchedule = schedule.find((d) => d.day_id === currentDayId);
    if (!todaySchedule) return false;

    if (todaySchedule.is_24_hrs) return true;

    const isOpen = todaySchedule.timing.some((slot) => {
      // only time extract
      const startTime = moment.utc(slot.start_time).utcOffset(330);
      const endTime = moment.utc(slot.end_time).utcOffset(330);

      // normalize to same date
      const start = moment(now).set({
        hour: startTime.hour(),
        minute: startTime.minute(),
        second: 0,
      });

      const end = moment(now).set({
        hour: endTime.hour(),
        minute: endTime.minute(),
        second: 0,
      });

      return now.isBetween(start, end);
    });

    return isOpen;
  }

  // order grocery and food
  async OrderPlaced(body, req: any, payment_type: string = null) {
    try {
      let user = req?.user ?? null;
      if (!user) {
        user = req?._id ? req : null;
      }

      const restaurant: any = await this.model.restaurant
        .findOne({ _id: body.restaurant_id })
        .populate([{ path: 'vendor_id' }]);

      // create customer
      let customer = null;

      if (user?._id) {
        customer = await this.model.customer.findById(user?._id);
      }
      if (!customer) {
        let phone = body.add_receiver_detail.phone ?? '';
        let email = body.add_receiver_detail.email ?? '';

        customer = await this.model.customer.findOne({ phone: phone });
        if (!customer) {
          customer = await this.model.customer.findOne({ email: email });
          if (!customer) {
            customer = await this.model.customer.create({
              name: body.add_receiver_detail.name ?? '',
              email: body.add_receiver_detail.email ?? '',
              country_code: body.add_receiver_detail.country_code ?? '',
              phone: body.add_receiver_detail.phone ?? '',
            });
          }
        }
      }

      if (restaurant && restaurant.status === 'offline') {
        throw new HttpException(
          {
            error_code: 'RESTAURANT_CLOSED',
            error_description:
              'The restaurant is currently closed. Please try again later.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (restaurant.is_block === true) {
        throw new HttpException(
          {
            error_code: 'RESTAURANT_BLOCKED',
            error_description:
              'The restaurant is currently not accepting orders. Please try again later.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      let processedGroceryItems = [];
      let calculatedCartAmount = 0;

      const appConfig = await this.model.appConfiguration.findOne();
      if (
        body.order_type !== OrderType.Pos &&
        appConfig.is_fixed_time_delivery
      ) {
        let lat = body?.delivery_address?.lat ?? '';
        let long = body?.delivery_address?.long ?? '';

        if (!lat || !long) {
          throw new HttpException(
            {
              error_code: 'DELIVERY_ADDRESS_REQUIRED',
              error_description:
                'Delivery address is required for fixed time delivery.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        let zone = await this.commonService.findZone(lat, long);
        if (!zone) {
          throw new HttpException(
            {
              error_code: 'ZONE_NOT_FOUND',
              error_description:
                'Zone not found for the given delivery address.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        body.zone_id = zone._id;
      }

      if (body.grocery_cart_items?.length > 0) {
        for (const item of body.grocery_cart_items || []) {
          const groceryItem = await this.model.GroceryItems.findById(
            item.grocery_id,
          );

          if (!groceryItem) {
            throw new HttpException(
              {
                error_code: 'GROCERY_ITEM_NOT_FOUND',
                error_description: `Grocery item with ID ${item.grocery_id} not found.`,
              },
              HttpStatus.NOT_FOUND,
            );
          }

          item.no_of_quantity;

          const query: any = {
            restaurant_id: body.restaurant_id,
            grocery_id: item.grocery_id,
          };

          if (body?.grocery_cart_items?.[0]?.cloth_stock_id) {
            query._id = new Types.ObjectId(
              body.grocery_cart_items[0].cloth_stock_id,
            );
          }

          const stock = await this.model.stock
            .findOne(query)
            .select('total_stock')
            .lean();

          if (!stock || stock.total_stock < item.no_of_quantity) {
            throw new HttpException(
              {
                error_code: 'INSUFFICIENT_STOCK',
                error_description: `Sorry! ${groceryItem.name} is not available in the requested quantity`,
              },
              HttpStatus.BAD_REQUEST,
            );
          }

          // const stock = await this.model.stock.findOneAndUpdate(
          //   {
          //     restaurant_id: body.restaurant_id,
          //     grocery_id: item.grocery_id,
          //     total_stock: { $gte: item.no_of_quantity },
          //   },
          //   {
          //     $inc: { total_stock: -item.no_of_quantity },
          //   },
          //   { new: true }
          // );

          // if (!stock) {
          //   throw new HttpException(
          //     {
          //       error_code: 'INSUFFICIENT_STOCK',
          //       error_description: `Insufficient stock for ${groceryItem.name}`,
          //     },
          //     HttpStatus.BAD_REQUEST,
          //   );
          // }

          const totalPrice = groceryItem.price * item.no_of_quantity;
          calculatedCartAmount += totalPrice;

          const actualPrice = groceryItem.price;

          processedGroceryItems.push({
            grocery_id: item.grocery_id,
            name: groceryItem.name,
            description: groceryItem.description,
            quantity: groceryItem.quantity,
            unit: `${groceryItem.quantity} ${groceryItem.unit}`,
            price: groceryItem.price,
            imageUrl: groceryItem.imageUrl,

            cloth_stock_id: item?.cloth_stock_id ?? null,
            color_code: item?.color_code ?? null,
            size: item?.size ?? null,

            no_of_quantity: item.no_of_quantity,
            total_price: totalPrice,
          });
        }

        body.grocery_cart_items = processedGroceryItems;
        body.cart_amount = calculatedCartAmount;

        if (this.model.cart) {
          await this.model.cart.updateMany(
            {
              customer_id: customer._id,
              restaurant_id: body.restaurant_id,
              is_ordered: false,
            },
            {
              $set: { is_ordered: true },
            },
          );
        }
      }

      const startOfToday = moment.utc().startOf('day').valueOf();
      let OrderId = await this.createOrderId();
      let order_placed_at = moment.utc().valueOf();
      const session = await this.model.session.find({
        user_id: restaurant.vendor_id._id,
      });

      let extimateDeliveryTime = 0;
      let distance = null;

      if (body.delivery_address !== undefined && body.delivery_address) {
        distance = await this.commonService.CalculateDistance(
          body.delivery_address.lat,
          body.delivery_address.long,
          restaurant.address.lat,
          restaurant.address.long,
        );

        const durationMatch = distance?.duration?.match(/\d+/);
        let durationInMinutes = parseInt(durationMatch[0], 10);
        extimateDeliveryTime =
          body.estimated_food_ready_time + durationInMinutes;
      }

      const order_count = await this.model.order.countDocuments({
        restaurant_id: body.restaurant_id,
        created_at: { $gte: startOfToday },
        order_status: { $nin: ['cancelled', 'failed', 'pending', null] },
      });
      let current_order_count = order_count + 1;
      //Add Tip to driver
      const tip_amount = body.tip_amount || 0;
      //End Add Tip to driver

      // Handle Scheduled Orders
      let scheduledTimestamp: number | null = null;
      const scheduled_time = body.scheduled_time;

      if (body.is_scheduled) {
        const scheduledTimestamp = moment(scheduled_time).valueOf();
        const now = moment().valueOf();

        console.log(
          'Scheduled Order Requested For:',
          moment(scheduled_time).format(),
        );
        console.log('Current Time:', moment().format());
        console.log('10 min from now:', moment(now + 10 * 60 * 1000).format());

        if (scheduledTimestamp <= now + 10 * 60 * 1000) {
          console.log('Scheduled time is too soon.');
          throw new HttpException(
            {
              error_code: 'RESTAURANT_CLOSED',
              error_description:
                'Scheduled time must be at least 10 minutes from now.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        // Check restaurant hours (assuming fields `opening_time` and `closing_time` as minutes in day)
        const scheduledMoment = moment(scheduled_time);
        const minutes =
          scheduledMoment.hours() * 60 + scheduledMoment.minutes();

        const dayOfWeek = scheduledMoment.format('dddd');
        console.log('Scheduled Day:', dayOfWeek);

        const workingDay = restaurant.working_day.find(
          (day) => day.day === dayOfWeek,
        );
        console.log('Matched Working Day:', workingDay);

        if (!workingDay) {
          console.log(`No working hours found for ${dayOfWeek}`);
          throw new HttpException(
            {
              error_code: 'RESTAURANT_CLOSED',
              error_description: `The restaurant is closed on ${dayOfWeek}.`,
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!workingDay.is_24_hrs) {
          const withinTiming1 = workingDay.timing.some((time) => {
            const start = moment(time.start_time);
            const end = moment(time.end_time);
            return scheduledMoment.isBetween(start, end, undefined, '[)');
          });

          const withinTiming = workingDay.timing.some((time) => {
            const scheduledTime = moment.utc(scheduledMoment, moment.ISO_8601);

            let start = moment.utc(time.start_time, moment.ISO_8601);
            let end = moment.utc(time.end_time, moment.ISO_8601);

            // Keep only time part by applying scheduled date
            start.set({
              year: scheduledTime.year(),
              month: scheduledTime.month(),
              date: scheduledTime.date(),
            });

            end.set({
              year: scheduledTime.year(),
              month: scheduledTime.month(),
              date: scheduledTime.date(),
            });

            // Handle overnight timing (example: 15:00 → 03:30 next day)
            if (end.isBefore(start)) {
              end.add(1, 'day');
            }

            // If scheduled time is after midnight and belongs to next day slot
            let compareTime = scheduledTime.clone();
            if (compareTime.isBefore(start) && end.isAfter(start)) {
              compareTime.add(1, 'day');
            }

            console.log('Scheduled UTC:', compareTime.format());
            console.log('Start UTC:', start.format());
            console.log('End UTC:', end.format());

            return compareTime.isBetween(start, end, undefined, '[]'); // inclusive
          });

          if (!withinTiming) {
            console.log('Scheduled time is outside working hours.');
            throw new HttpException(
              {
                error_code: 'RESTAURANT_CLOSED',
                error_description:
                  'Scheduled time is outside restaurant working hours.',
              },
              HttpStatus.BAD_REQUEST,
            );
          } else {
            console.log('Scheduled time is within working hours.');
          }
        } else {
          console.log('Restaurant is open 24 hours that day.');
        }
      } else {
        const open = await this.isRestaurantOpen(restaurant.working_day);
        if (!open) {
          throw new HttpException(
            {
              error_code: 'RESTAURANT_CLOSED',
              error_description: 'Restaurant is Closed at this time',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      let otp = null;
      if (process.env.ENVIROMENT === 'live') {
        otp = await this.commonService.generateOtp();
      } else {
        otp = '1234';
      }
      //End Schedule Order

      // console.log('===========>>>>> body.subscription_type', body.subscription_type);

      if (body.subscription_type != undefined && body.subscription_type != '') {
        let today = new Date(body.order_time);

        const utcHours = today.getUTCHours();
        const utcMinutes = today.getUTCMinutes();

        let nowMinutes = utcHours * 60 + utcMinutes;

        let subscriptionOrder = await this.model.SubscribeOrderModel.create({
          order_id: OrderId,
          customer_id: customer?._id ?? null,
          order_placed_at: order_placed_at,
          estimated_delivery_time: extimateDeliveryTime,
          distance: distance?.distance ?? 0,
          order_count_for_restaurant: current_order_count,
          ...body,
          delivery_otp: otp,
          otp_sent_at: moment.utc().valueOf(),
          order_status: OrderStatus.OrderPending,
          // is_open_for_driver: false,
          tip_amount,
          ...(body.is_scheduled && {
            scheduled_time: scheduled_time,
            order_type: 'schedule',
          }),
          order_time_in_minutes: nowMinutes,
          subscription_type: body.subscription_type,
          subscription_monthly: body.subscription_monthly,
          subscription_weekly: body.subscription_weekly,
        });

        // for notification
        let session = await this.model.session.find({
          user_id: restaurant?.vendor_id?._id ?? null,
        });

        if (session.length > 0) {
          for (const fcm of session) {
            const title_key = 'new_subscription_title';
            const description_key = 'new_subscription_description';
            const title_localization =
              await this.commonService.localization(title_key);
            const description_localization =
              await this.commonService.localization(description_key);

            let push_content = {
              title:
                title_localization[restaurant.vendor_id.preferred_language],
              description:
                description_localization[
                  restaurant.vendor_id.preferred_language
                ],
            };
            let push_data = {
              type: 'subscription_update',
              subscription_order_id: subscriptionOrder._id.toString(),
            };

            this.commonService.send_notification(
              push_content,
              fcm?.fcm_token ?? '',
              push_data,
              restaurant?.vendor_id?._id,
            );
          }
        }

        return {
          status: true,
          message: 'order subscription create successfull',
        };
      } else {
        const createOrder: any = await this.model.order.create({
          order_id: OrderId,
          customer_id: customer?._id ?? null,
          order_placed_at: order_placed_at,
          estimated_delivery_time: extimateDeliveryTime || 0,
          distance: distance?.distance ?? 0,
          order_count_for_restaurant: current_order_count,
          ...body,
          delivery_otp: otp,
          otp_sent_at: moment.utc().valueOf(),
          order_status: OrderStatus.OrderPending,
          // is_open_for_driver: false,
          tip_amount,
        });

        if (body.is_scheduled) {
          const kolkataMoment = moment.tz(body.scheduled_time, 'Asia/Kolkata');
          const utcMoment = kolkataMoment.utc();

          createOrder.scheduled_time = utcMoment;
          // createOrder.order_type = 'schedule'

          await createOrder.save();
        }

        if (payment_type == PaymentType.Wallet) {
          return createOrder;
        }

        if (
          appConfig.isFreeDeliveryAvailable &&
          appConfig.freeDeliveryMinOrderAmount <= createOrder.cart_amount
        ) {
          createOrder.free_delivery_fee =
            appConfig.base_fee +
            createOrder.distance * appConfig.distance_per_km; //- commission_from_driver;

          await createOrder.save();
        }

        if (appConfig.is_fixed_time_delivery) {
          const fixedTimeDelivery = appConfig.fixed_time_delivery;
          // Get today's day name (example: Monday)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          const nextDay = tomorrow.toLocaleString('en-US', {
            weekday: 'long',
          });

          // Find complete object for next day
          const nextDayDeliverySlot = fixedTimeDelivery.find(
            (item) => item.day === nextDay,
          );

          createOrder.fixed_time_delivery = nextDayDeliverySlot
            ? nextDayDeliverySlot
            : null;
          createOrder.is_fixed_time_delivery = true;
          (createOrder.is_open_for_driver = false), await createOrder.save();
        }

        if (createOrder.order_type == OrderType.Table_order) {
          //Ordinal formatter
          function getOrdinal(n: number) {
            const s = ['th', 'st', 'nd', 'rd'],
              v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
          }

          let user_order_count = await this.model.order.countDocuments({
            restaurant_id: createOrder.restaurant_id,
            customer_id: createOrder.customer_id,
            order_status: { $nin: ['cancelled', 'failed', 'pending', null] },
          });
          createOrder.user_order_count = getOrdinal(user_order_count || 1);

          createOrder.order_status = OrderStatus.OrderConfirmed;
          createOrder.payment_status = PaymentStatus.Pending;
          await createOrder.save();

          return { data: createOrder };
        }

        if (createOrder.order_type == OrderType.Pos) {
          createOrder.order_status = OrderStatus.pos;
          createOrder.delivery_otp = null;
          createOrder.otp_sent_at = null;

          await createOrder.save();

          await this.model.earnings.create({
            reference_id: createOrder.order_id,
            order_id: createOrder._id,
            restaurant_id: createOrder.restaurant_id,
            customer_id: createOrder.customer_id,
            food_amount: createOrder.cart_amount,
            delivery_charge: createOrder.delivery_fee,
            tip_amount: createOrder.tip_amount,
            total_amount: createOrder.total_amount,
            app_commission: 0,
            restaurant_earning: createOrder.total_amount,
            commission_from_restaurant: 0,
            commission_from_driver: 0,
            tax: createOrder.tax_amount,
            payment_type: createOrder.payment_type,
            order_placed_at: createOrder.order_placed_at,
            pay_to_vendor: 'complete',
            pay_to_driver: 'pending',
            earning_type: createOrder?.order_type || null,
          });

          return { data: createOrder };
        }

        console.log(' crate order ===>>> ', createOrder);

        if (createOrder && createOrder.total_amount <= 0) {
          throw new HttpException(
            {
              error_code: 'INVALID_ORDER_AMOUNT',
              error_description: 'Order amount must be greater than zero.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (appConfig.paymentGateway == PaymentGateway.STRIPE) {
          /* Webhook Implemented */
          let stripePaymentSucceeded = false;
          const data_to_send: any = {
            amount: +(body?.total_amount * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
            currency: 'aud',

            payment_method_options: {
              card: {
                setup_future_usage: 'none',
              },
            },

            customer: (
              customer?.stripe_customer_id || customer._id
            )?.toString(),
            automatic_payment_methods: { enabled: true },
            metadata: {
              type: 'card',
              meta_type: 'ORDER',
              customer_id: customer._id.toString(),
              order_id: createOrder._id.toString(),
              name: body.add_receiver_detail?.name || '',
              order_placed_at: order_placed_at,
              restaurant_id: body.restaurant_id.toString(),
            },
          };

          let stripeClient = await this.commonService.createStripeClient();
          const intent = await stripeClient.paymentIntents.create(data_to_send);
          console.log('intent', intent);

          let ephemeralKey = await this.commonService.createEphemeralKey(
            customer?.stripe_customer_id,
          );

          /* end webhook */
          stripePaymentSucceeded = intent?.status === 'succeeded';
          if (stripePaymentSucceeded) {
            console.log(stripePaymentSucceeded, 'stripePaymentSucceeded');
          } else {
            console.log('Payment intent not succeeded, order not created');
          }

          return {
            client_secret: intent?.client_secret,
            ephemeralKey: ephemeralKey,
            customer: customer.stripe_customer_id,
            data: createOrder,
          };
        } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {
          let obj = {
            paymentFor: '',
            order: createOrder,
            total_amount: createOrder.total_amount.toFixed(2), // to fixed 2
            customer: customer,
          };
          // create payment intent for razor pay
          let razorpay = await this.RazorpayService.createPaymentIntent(obj);
          return {
            razorpay: razorpay,
          };
        }
      }
    } catch (error) {
      console.log('error ==>>>>>>> ddd ', error);

      throw error;
    }
  }

  createOrderId(): string {
    // Generate a unique UUID
    const uniqueId = uuidv4();

    // Extract the numeric part from the UUID and limit it to 7 digits
    const numericPart = parseInt(uniqueId.replace(/\D/g, ''), 10);
    const sevenDigitNumber = ('0000000' + (numericPart % 10000000)).slice(-7);

    // Concatenate the prefix "ct" with the unique UUID
    const customUniqueId = `HFFD${sevenDigitNumber}`;

    return customUniqueId;
  }

  async OrderDetail(order_id) {
    try {
      let data_to_aggregate = [
        await this.orderAggregation.match(order_id),
        await this.orderAggregation.CustomerLookup(),
        await this.orderAggregation.UnwindCustomerLookup(),
        await this.orderAggregation.DriverLookup(),
        await this.orderAggregation.UnwindDriverLookup(),
        await this.orderAggregation.RestaurantLookup(),
        await this.orderAggregation.UnwindRestaurantLookup(),
        await this.orderAggregation.RatingLookup(),
        // await this.orderAggregation.UnwindReviewLookup(),
        await this.orderAggregation.project(),
      ];

      let data = await this.model.order.aggregate(data_to_aggregate);
      return { data: data[0] };
    } catch (error) {
      throw error;
    }
  }

  async handleCanelOrder(order_id, user_id) {
    const currentUtcTime = moment.utc().format();

    const order = await this.model.order.findOne({
      _id: new Types.ObjectId(order_id),
      customer_id: user_id,
    });
    if (!order) {
      throw new HttpException(
        `only customer can cancel.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const payment = await this.model.payment.findOne({
      order_id: new Types.ObjectId(order_id),
    });
    let refund: any = null;
    if (payment.paymentGateway === PaymentGateway.RAZORPAY) {
      refund = await this.RazorpayService.refund(
        payment.payment_intent,
        payment.total_amount,
      );
      if (refund.id !== '') {
        await this.model.payment.updateOne(
          { order_id: new Types.ObjectId(order_id) },
          { payment_status: 'refunded' },
        );
      }
    } else if (payment.paymentGateway === PaymentGateway.STRIPE) {
      refund = await this.paymentService.refund(payment?.payment_intent);
      if (refund.status === 'succeeded') {
        await this.model.payment.updateOne(
          { order_id: new Types.ObjectId(order_id) },
          { payment_status: 'refunded' },
        );
      }
    } else if (payment.payment_type == payment_type.Wallet) {
      let wallet: any = await this.model.walletModel.findOne({
        customer_id: user_id,
      });
      if (wallet) {
        wallet.balance += Number(payment.total_amount);
        await wallet.save();
      }

      await this.model.walletTransactionModel.create({
        customer_id: user_id,
        type: WalletTxnType.CREDIT,
        credit_type: WalletTxnCreditType.Point,
        amount: payment.total_amount,
        description: 'Wallet credit for order refund',
      });
    }

    const order_cancel = await this.model.order.findOneAndUpdate(
      { _id: new Types.ObjectId(order_id) },
      {
        order_status: 'cancelled',
        payment_status: PaymentStatus.Refunded,
        refund_at: currentUtcTime,
      },
      { new: true },
    );

    return order_cancel;
  }

  async cancelOrders(order_id: string, req: any) {
    try {
      console.log('==>>>>>>>>>> eeee');

      const { _id: user_id } = req['user'];

      let order = await this.handleCanelOrder(order_id, user_id);

      const session = await this.model.session.find({ user_id: user_id });

      if (session.length > 0) {
        for (const fcm of session) {
          const title_localization = `Order Cancelled`;
          const description_localization = `Your order has been cancelled and the amount has been refunded to your account.`;
          let push_content = {
            title: title_localization,
            description: description_localization,
          };
          let push_data = {
            type: 'amount_refund',
            order_id: order_id,
          };
          this.commonService.send_notification(
            push_content,
            fcm.fcm_token,
            push_data,
            user_id,
          );
        }
      }

      return {
        data: order,
      };
    } catch (error) {
      throw error;
    }
  }

  async refundOrderAmountByAdmin(order_id: string, req: any, dto: RefundDto) {
    try {
      const currentUtcTime = moment.utc().format();

      const order: any = await this.model.order.findOne({
        _id: new Types.ObjectId(order_id),
        order_status: OrderStatus.Delivered,
      });
      if (!order) {
        throw new HttpException(
          `Order not found. Please check the order ID and try again.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const currentUtcTime_ = moment.utc();
      const orderCreatedAtUtc = moment.utc(order.createdAt);
      const diffInDays = currentUtcTime_.diff(orderCreatedAtUtc, 'days');
      console.log('diffInDays', diffInDays);

      if (diffInDays > 2) {
        throw new HttpException(
          `⏳ Cannot refund after 2 days from delivery.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const payment = await this.model.payment.findOne(
        { order_id: new Types.ObjectId(order_id) },
        { payment_intent: 1, order_id: 1, payment_status: 1 },
        { new: true },
      );
      if (!payment) {
        throw new HttpException(`Payment not found.`, HttpStatus.BAD_REQUEST);
      } else if (payment.payment_status === PaymentStatus.Refunded) {
        throw new HttpException(
          `Order already refunded.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      let refund: any = null;
      if (payment.paymentGateway === PaymentGateway.RAZORPAY) {
        refund = await this.RazorpayService.refund(
          payment.payment_intent,
          payment.total_amount,
        );
      } else if (payment.paymentGateway === PaymentGateway.STRIPE) {
        refund = await this.paymentService.refund(payment?.payment_intent);
      } else if (payment.payment_type == payment_type.Wallet) {
        let wallet: any = await this.model.walletModel.findOne({
          customer_id: order.customer_id,
        });
        if (wallet) {
          wallet.balance += Number(payment.total_amount);
          await wallet.save();
        }

        await this.model.walletTransactionModel.create({
          customer_id: order.customer_id,
          type: WalletTxnType.CREDIT,
          credit_type: WalletTxnCreditType.Point,
          amount: payment.total_amount,
          description: 'Wallet credit for order refund',
        });
      }

      await this.model.payment.updateOne(
        { order_id: new Types.ObjectId(order_id) },
        { payment_status: 'refunded' },
      );

      const refund_order = await this.model.order.findOneAndUpdate(
        { _id: new Types.ObjectId(order_id) },
        {
          payment_status: PaymentStatus.Refunded,
          refund_reason: dto.refund_reason,
          refund_liability: dto.refund_liability,
          refund_at: currentUtcTime,
        },
        { new: true },
      );

      const session = await this.model.session.find({
        user_id: order.customer_id,
      });

      if (session.length > 0) {
        for (const fcm of session) {
          const title_localization = `Amount Refunded`;
          const description_localization = `The order amount has been refunded to your account.`;
          let push_content = {
            title: title_localization,
            description: description_localization,
          };
          let push_data = {
            type: 'amount_refund',
            order_id: order_id,
          };
          this.commonService.send_notification(
            push_content,
            fcm.fcm_token,
            push_data,
            order.customer_id,
          );
        }
      }

      return {
        data: refund_order,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateOrderStatusByAdmin(order_id: string, status: string) {
    try {
      const currentUtcTime = moment.utc().format();
      const orderObjectId = new Types.ObjectId(order_id);

      const order = await this.model.order
        .findById(orderObjectId)
        .populate('restaurant_id');
      if (!order) {
        throw new HttpException(
          '🚫 Order not found. Please check the order ID and try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (status === OrderStatus.Cancelled) {
        let driver = await this.model.driver.findOne({ _id: order.driver_id });
        if (driver) {
          await this.model.driver.updateOne(
            { _id: order.driver_id },
            {
              current_order: null,
              ride_status: 'free',
              currently_send_ride_request_id: null,
              currently_send_ride_request: false,
            },
          );
        }

        let updatedOrder = await this.handleCanelOrder(
          order._id,
          order.customer_id,
        );

        const session = await this.model.session.find({
          user_id: order.customer_id,
        });

        if (session.length > 0) {
          for (const fcm of session) {
            const title_localization = `Order Cancelled`;
            const description_localization = `The order was cancelled by the admin, and the refund has been successfully processed to your account.`;
            let push_content = {
              title: title_localization,
              description: description_localization,
            };
            let push_data = {
              type: 'amount_refund',
              order_id: order_id,
            };
            this.commonService.send_notification(
              push_content,
              fcm.fcm_token,
              push_data,
              order.customer_id,
            );
          }
        }

        return { data: updatedOrder };
      }

      if (status === OrderStatus.Delivered) {
        const updatedOrder = await this.model.order.findOneAndUpdate(
          { _id: orderObjectId },
          {
            is_open_for_driver: false,
            rider_status: RiderStatus.Delivered,
            order_status: OrderStatus.Delivered,
            order_delivered_at: moment.utc().valueOf(),
          },
          { new: true },
        );

        let restaurant: any = order.restaurant_id;

        let vendor = await this.model.vendor.findOne({
          _id: restaurant.vendor_id,
        });

        await this.model.driver.updateOne(
          { _id: order.driver_id },
          { current_order: null, ride_status: 'free' },
        );

        // create order earning
        await this.commonService.createOrderEarning(order);

        // Loyalty + Referral logic
        const customer = await this.model.customer.findOne({
          _id: updatedOrder.customer_id,
        });
        this.loyaltyService.manageReferralAfterFinalOrder(customer);

        const appConfig = await this.model.appConfiguration.findOne();
        // eligible for points
        if (
          appConfig &&
          appConfig.loyalty &&
          appConfig.loyalty_minimun_order &&
          order.cart_amount > appConfig.loyalty_minimun_order
        ) {
          // calculate points
          let amount_per_loyalty = appConfig?.amount_per_loyalty ?? 20;
          let earnedPoints = Math.trunc(order.cart_amount / amount_per_loyalty);
          if (earnedPoints > 0) {
            await this.loyaltyService.awardPoints(
              customer._id,
              updatedOrder._id,
              earnedPoints,
              LoyaltyPointType.EARNED,
              'Points awarded for order payment',
            );

            console.log(
              `✅ Awarded ${earnedPoints} loyalty points to user ${customer._id}`,
            );
          }
        }

        const session = await this.model.session.findOne({
          user_id: order?.customer_id,
        });
        let key_title = 'order_delivered_title';
        let key_desc = 'order_delivered_description';
        let localization_title =
          await this.commonService.localization(key_title);
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
        this.commonService.send_notification(
          push_data,
          session?.fcm_token,
          data,
          order?.customer_id,
        );
      }

      const updatedOrder = await this.model.order.findOneAndUpdate(
        { _id: orderObjectId },
        { order_status: status },
        { new: true },
      );

      return { data: updatedOrder };
    } catch (error) {
      throw error;
    }
  }

  async find_order_with_id(id) {
    try {
      const order: any = await this.model.order
        .findOne({ _id: id })
        .populate([{ path: 'customer_id' }, { path: 'delivery_partner_id' }]);
      return order;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async ApplyPromoCode(body) {
    try {
      const find_this_promo_code: any = await this.model.coupon.findOne({
        code: body.promo_code,
        minimum_booking_amount: { $lte: parseInt(body.min_food_amount) },
        // type: 'one-time',
        used_by: [],
      });

      if (find_this_promo_code) {
        if (find_this_promo_code.status === 'active') {
          return { data: find_this_promo_code };
        } else {
          throw new HttpException(
            {
              error_code: 'currently this coupon is deactivate by admin',
              error_description: 'currently this coupon is deactivate by admin',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        throw new HttpException(
          {
            error_code: 'INVALID_PROMO_CODE',
            error_description: 'Invalid promo code ',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async orderListing(body) {
    try {
      const skip = (body.page - 1) * body.limit;

      // Initialize query and searchQuery
      let query : any = {};
      let searchQuery : any = {};

      // Handle search query if search is provided
      if (body.search) {
        searchQuery = { order_id: { $regex: body.search, $options: 'i' } };
      }

      // Handle status-based query
      switch (body.status) {
        case Status.Active:
          query = {
            order_status: {
              $in: [
                OrderStatus.OrderPlaced,
                OrderStatus.OrderConfirmed,
                OrderStatus.PickedUp,
                OrderStatus.OutForDelivery,
                OrderStatus.ReadyForPickup,
              ],
            },
            payment_status: PaymentStatus.Complete,
          };
          break;
        case Status.Completed:
          query = { order_status: OrderStatus.Delivered };
          break;
        case Status.cancelled:
          query = { order_status: OrderStatus.Cancelled };
          break;
        case Status.failed:
          query = { order_status: OrderStatus.Failed };
          break;

        case Status.pos:
          query = { order_status: OrderStatus.pos };
          break;
      }


      if(body.order_type !== undefined && body.order_type !== ""){
        query.order_type = body.order_type;
      }else {
        query.order_type = { $ne: OrderType.Table_order };
      }


      // Combine search query with main query
      const finalQuery = { ...query, ...searchQuery };

      // Fetch data with pagination and sorting
      const data = await this.model.order
        .find(finalQuery)
        .select({
          order_id: 1,
          created_at: 1,
          deliver_type: 1,
          delivery_address: 1,
          order_placed_at: 1,
          order_status: 1,
          table_no : 1,
          payment_status: 1,
          refund_at: 1,
        })
        .populate({
          path: 'customer_id',
          select: 'name',
        })
        .populate({
          path: 'driver_id',
          select: 'name',
        })
        .populate({
          path: 'restaurant_id',
          select: 'restaurant_name address restaurant_type',
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(body.limit);

      // Count total documents matching the query
      const data_count = await this.model.order.countDocuments(finalQuery);

      return {
        data_count,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelPendingOrders() {
    try {
      let twenty_four_hours_ago = moment.utc().subtract(24, 'hours').valueOf();
      let query = {
        order_status: { $ne: 'delivered' },
        order_placed_at: { $lt: twenty_four_hours_ago },
      };
      let options = { lean: true };
      let orders = await this.model.order.find(query, { _id: 1 }, options);
      for (let i = 0; i < orders.length; i++) {
        const query = { order_id: orders[i]._id, payment_type: 'card' };
        let payment = await this.model.payment.findById(
          query,
          { payment_method_id: 1 },
          options,
        );
        let refund = await this.paymentService.refund(
          payment?.payment_method_id,
        );
        if (refund.status === 'succeeded') {
          await this.model.payment.updateOne(
            { _id: payment._id },
            { payment_status: 'refunded' },
          );
        }
        await this.model.order.updateOne(
          { _id: orders[i]._id },
          { order_status: 'cancelled' },
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async assignDriverByAdmin(driver_id: string, order_id: string) {
    try {
      const driver = await this.model.driver.findOne({
        _id: new Types.ObjectId(driver_id),
      });
      if (!driver) {
        throw new HttpException(
          '🚫 Driver not found. Please check the driver id and try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.model.order.findOne({
        _id: new Types.ObjectId(order_id),
      });
      if (!order) {
        throw new HttpException(
          '🚫 Order not found. Please check the order id and try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (order.driver_id != null)
        throw new HttpException(
          'Driver has aleady been assigned! Please check',
          HttpStatus.BAD_REQUEST,
        );

      const assign_driver = await this.model.order.findOneAndUpdate(
        { _id: new Types.ObjectId(order_id) },
        {
          driver_id: new Types.ObjectId(driver_id),
          rider_status: 'way_to_restaurant',
          is_open_for_driver: false,
        },
        { new: true },
      );

      await this.model.driver.updateOne(
        { _id: new Types.ObjectId(driver_id) },
        { current_order: new Types.ObjectId(order_id), ride_status: 'busy' },
      );

      // Send notification to driver
      let key_title = 'driver_assign_title';
      let key_desc = 'driver_assign_description';
      let localization_title = await this.commonService.localization(key_title);

      let localization_description =
        await this.commonService.localization(key_desc);

      const session = await this.model.session.findOne({
        user_id: driver_id,
      });

      let language = driver?.preferred_language || 'english';
      let push_data = {
        title: '',
        description: '',
      };

      if (localization_title && localization_description) {
        push_data.title = localization_title[language] ?? '';
        push_data.description = localization_description[language] ?? '';
      }

      let data = {
        order_id: order._id,
        type: 'admin',
      };
      this.commonService.send_notification(
        push_data,
        session?.fcm_token,
        data,
        driver_id,
      );
      // End Send notification to driver
      return {
        message: `Driver has been assigned successfully`,
        data: assign_driver,
      };
    } catch (error) {
      console.log('error===>>>>>>>>>', error);

      throw error;
    }
  }

  async downloadInvoice(id, body) {
    try {
      console.log('body', id, body);
      let order: any = await this.model.order
        .findOne({ _id: id })
        .populate([
          { path: 'driver_id' },
          { path: 'customer_id' },
          { path: 'restaurant_id' },
        ]);

      if (!order) {
        throw new Error('Order not found');
      }
      const earnings: any = await this.model.earnings.findOne({
        order_id: id,
      });

      let file_path = path.join(__dirname, '../../dist/emails/invoice.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
      });

      const allItems = [
        ...(order.cart_items || []),
        ...(order.grocery_cart_items || []),
      ];

      let cart_items_total_prices = allItems.map((item) => {
        const addOns = Array.isArray(item.add_ons) ? item.add_ons : [];

        console.log('addOns ==>>>', addOns);

        const addOnsTotal = addOns.reduce(
          (acc, addon) => acc + Number(addon.additional_price || '0'),
          0,
        );

        const basePrice = item.price || 0;
        const quantity = item.no_of_quantity || 1;

        const totalPrice = (Number(basePrice) + Number(addOnsTotal)) * quantity;
        return totalPrice.toFixed(2);
      });

      const commonData = {
        orderId: order.order_id,
        customerName: order?.customer_id?.name ?? '',
        driverName: order.driver_id ? order.driver_id.name : 'N/A',
        restaurantName: order.restaurant_id
          ? order.restaurant_id.restaurant_name
          : 'N/A',
        subtotal: order.cart_amount.toFixed(2),
        tax: order.tax_amount.toFixed(2),
        deliveryCharge: order.delivery_fee.toFixed(2) || 0,
        totalAmount: order.total_amount.toFixed(2),

        date: moment(order.createdAt).format('DD-MM-YYYY'),

        cart_items: allItems,

        deliveryAddress: order.delivery_address.name,
        restaurantAddress: order.restaurant_id.address.name,

        cart_total_amount: cart_items_total_prices,
        couponDiscount: order.coupon_amount ? order.coupon_amount : 0,

        platform_fee: order.platform_fee,

        tip_amount: order.tip_amount,
        deliver_type: order.deliver_type,
        driverCut:
          (earnings?.commission_from_driver ?? false)
            ? earnings.commission_from_driver.toFixed(2)
            : 0,
      };

      let roleSpecificData = {};

      if (body.type === 'driver') {
        const driverTipAmount = parseFloat(order.tip_amount || 0);
        const driverTripAmount = parseFloat(order.delivery_fee || 0);
        const driverFinalEarning =
          driverTipAmount +
          driverTripAmount -
          earnings.commission_from_driver.toFixed(2);

        roleSpecificData = {
          driverTipAmount: driverTipAmount.toFixed(2),
          driverTripAmount: driverTripAmount.toFixed(2),
          driverFinalEarning: driverFinalEarning.toFixed(2),
        };
      }

      if (body.type === 'vendor') {
        const restaurantEarning = earnings.restaurant_earning;
        const restaurantCut = earnings.commission_from_restaurant;
        roleSpecificData = {
          restaurantEarning: restaurantEarning.toFixed(2),
          restaurantCut: restaurantCut.toFixed(2),
        };
      }

      if (body.type === 'admin') {
        const driverEarning = earnings?.driver_earning || 0;
        const restaurantEarning = earnings?.restaurant_earning || 0;
        const platformFee =
          earnings?.commission_from_restaurant +
            earnings?.commission_from_driver || 0;
        const adminRevenue =
          (earnings?.commission_from_restaurant || 0) +
          (earnings?.commission_from_driver || 0);

        roleSpecificData = {
          driverEarning: driverEarning.toFixed(2),
          restaurantEarning: restaurantEarning.toFixed(2),
          platformFee: platformFee.toFixed(2),
          taxAmount: earnings?.tax?.toFixed(2) || '0.00',
          adminRevenue: adminRevenue.toFixed(2),
        };
      }
      const data = { ...commonData, ...roleSpecificData };
      const htmlToSend = template(data);
      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlToSend, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      await browser.close();
      // Define the S3 bucket parameters
      const pdfFileName = `Invoice_${order._id}.pdf`;
      await this.appService.uploadInvoice(pdfFileName, pdfBuffer);
      await browser.close();
      // Return the URL to the generated PDF

      let appConfig = await this.model.appConfiguration.findOne().lean();
      if (!appConfig || !appConfig.bucket) {
        throw new Error('Bucket not found');
      }

      const downloadUrl = `${appConfig.bucket.do_endpoint}/${appConfig.bucket.bucket_name}/${pdfFileName}`;
      return { url: downloadUrl, data: data, type: body.type };
    } catch (error) {
      throw error;
    }
  }

  async createOrderForGuest(body, customer) {
    try {
      const restaurant: any = await this.model.restaurant
        .findOne({ _id: body.restaurant_id })
        .populate([{ path: 'vendor_id' }]);

      if (restaurant.status === 'offline') {
        throw new HttpException(
          {
            error_code: 'RESTAURANT_CLOSED',
            error_description:
              'The restaurant is currently closed. Please try again later.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (restaurant.is_block === true) {
        throw new HttpException(
          {
            error_code: 'RESTAURANT_BLOCKED',
            error_description:
              'The restaurant is currently not accepting orders. Please try again later.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const guest = body.add_guest_detail;
      const delivery = body.delivery_address;
      if (!guest?.name || !guest?.phone || !guest?.country_code || !delivery) {
        throw new HttpException(
          {
            error_code: 'MISSING_GUEST_DETAILS',
            error_description:
              'guest details and delivery address are required for guest orders.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const startOfToday = moment.utc().startOf('day').valueOf();
      let OrderId = await this.createOrderId();
      let order_placed_at = moment.utc().valueOf();

      const session = await this.model.session.find({
        user_id: restaurant.vendor_id._id,
      });

      const distance = await this.commonService.CalculateDistance(
        delivery.lat,
        delivery.long,
        restaurant.address.lat,
        restaurant.address.long,
      );

      const durationMatch = distance?.duration?.match(/\d+/);
      let durationInMinutes = parseInt(durationMatch[0], 10);
      let extimateDeliveryTime =
        body.estimated_food_ready_time + durationInMinutes;

      const order_count = await this.model.order.countDocuments({
        restaurant_id: body.restaurant_id,
        created_at: { $gte: startOfToday },
        order_status: { $nin: ['cancelled', 'failed', 'pending', null] },
      });
      let current_order_count = order_count + 1;
      const tip_amount = body.tip_amount || 0;

      let otp = null;
      if (process.env.ENVIROMENT === 'live') {
        otp = await this.commonService.generateOtp();
      } else {
        otp = '1234';
      }

      // Create order with guest fields
      const createOrder = await this.model.order.create({
        order_id: OrderId,
        is_guest_customer: true,
        guest_name: guest.name,
        guest_phone: guest.phone,
        guest_country_code: guest.country_code,
        guest_email: guest.email,
        order_placed_at: order_placed_at,
        estimated_delivery_time: extimateDeliveryTime,
        distance: distance.distance,
        order_count_for_restaurant: current_order_count,
        ...body,
        order_status: OrderStatus.OrderPending,
        delivery_otp: otp,
        otp_sent_at: moment.utc().valueOf(),
        tip_amount,
      });

      const pricing = await this.model.appConfiguration.findOne();

      let commission_from_restaurant = 0;
      if (
        pricing.commission_for_restaurant_by ===
        CommissionForRestaurantBy.Percentage
      ) {
        commission_from_restaurant =
          (createOrder.cart_amount *
            pricing.commission_percentage_for_restaurant) /
          100;
      } else {
        commission_from_restaurant =
          pricing.commission_percentage_for_restaurant;
      }

      const commission_from_driver =
        (createOrder.delivery_fee * pricing.commission_percentage_for_driver) /
        100;
      const restaurant_earning =
        createOrder.cart_amount - commission_from_restaurant;
      const driver_earning = createOrder.delivery_fee + tip_amount;
      createOrder.total_amount += tip_amount;

      await this.model.earnings.create({
        reference_id: createOrder.order_id,
        order_id: createOrder._id,
        restaurant_id: createOrder.restaurant_id,
        guest_phone: guest.phone,
        food_amount: createOrder.cart_amount,
        delivery_charge: createOrder.delivery_fee,
        tip_amount: tip_amount,
        total_amount: createOrder.total_amount,
        app_commission: pricing.app_commission,
        restaurant_earning,
        driver_earning,
        commission_from_restaurant,
        commission_from_driver,
        tax: createOrder.tax_amount,
        payment_type: createOrder.payment_type,
        order_placed_at: createOrder.order_placed_at,
        pay_to_vendor: 'pending',
        pay_to_driver: 'pending',
      });

      if (session.length > 0) {
        for (const fcm of session) {
          const title_key = 'new_order_restaurant_title';
          const description_key = 'new_order_restaurant_description';
          const title_localization =
            await this.commonService.localization(title_key);
          const description_localization =
            await this.commonService.localization(description_key);

          const push_content = {
            title: title_localization[restaurant.vendor_id.preferred_language],
            description:
              description_localization[restaurant.vendor_id.preferred_language],
          };

          const push_data = {
            type: 'order_received',
            order_id: createOrder._id,
          };

          this.commonService.send_notification(
            push_content,
            fcm.fcm_token,
            push_data,
            restaurant?.vendor_id?._id ?? '',
          );
        }
      }

      return { data: createOrder };
    } catch (error) {
      throw error;
    }
  }

  // async getOrderAnalyticsTable(query: HeatMapQueryDto) {
  //   const page = Number(query.page) || 1;
  //   const limit = Number(query.limit) || 10;
  //   const range = query.range || 'all';

  //   const skip = (page - 1) * limit;
  //   const startDate = await this.getStartDateFromRange(range);

  //   const match: any = { order_status: 'delivered' };
  //   if (startDate) match.order_delivered_at = { $gte: startDate };

  //   const pipeline: any = [
  //     { $match: match },
  //     {
  //       $group: {
  //         _id: "$restaurant_id",
  //         order_count: { $sum: 1 },
  //         last_order_date: { $max: "$order_delivered_at" },
  //         sample_order: { $first: "$$ROOT" }
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: "restaurants",
  //         localField: "_id",
  //         foreignField: "_id",
  //         as: "restaurant"
  //       }
  //     },
  //     {
  //       $unwind: {
  //         path: "$restaurant",
  //         preserveNullAndEmptyArrays: true // avoid breaking if restaurant is missing
  //       }
  //     },
  //     {
  //       $project: {
  //         restaurant_id: "$_id",
  //         restaurant_name: { $ifNull: ["$restaurant.name", "Unknown"] },
  //         order_count: 1,
  //         last_order_date: 1,
  //         area_name: "$sample_order.delivery_address.area"
  //       }
  //     },
  //     { $sort: { order_count: -1 } },
  //     {
  //       $facet: {
  //         metadata: [{ $count: "total" }],
  //         data: [{ $skip: skip }, { $limit: limit }]
  //       }
  //     }
  //   ];

  //   const result = await this.model.order.aggregate(pipeline);
  //   const data = result[0]?.data || [];
  //   const total = result[0]?.metadata?.[0]?.total || 0;

  //   const ranked = data.map((item, index) => ({
  //     ...item,
  //     rank: skip + index + 1
  //   }));

  //   return {
  //     total,
  //     currentPage: page,
  //     totalPages: Math.ceil(total / limit),
  //     data: ranked
  //   };
  // }

  async getOrderAnalyticsTable(query: HeatMapQueryDto) {
    const startDate = await this.getStartDateFromRange(query.range || 'all');

    const match: any = { order_status: 'delivered' };
    if (startDate) match.order_delivered_at = { $gte: startDate };

    const pipeline: any = [
      { $match: match },
      {
        $group: {
          _id: {
            area_name: '$delivery_address.area',
          },
          order_count: { $sum: 1 },
          last_order_date: { $max: '$order_delivered_at' },
        },
      },
      {
        $project: {
          _id: 0,
          // restaurant_id: "$_id.restaurant_id",
          area_name: '$_id.area_name',
          order_count: 1,
          last_order_date: 1,
        },
      },
      {
        $sort: { order_count: -1 },
      },
    ];

    const data = await this.model.order.aggregate(pipeline);

    // Add rank + default restaurant_name if needed
    const finalData = data.map((item, index) => ({
      ...item,
      // restaurant_name: "Unknown",
      rank: index + 1,
    }));

    return {
      total: finalData.length,
      currentPage: 1,
      totalPages: 1,
      data: finalData,
    };
  }

  async getOrderHeatMapData(query: HeatMapQueryDto) {
    const startDate = await this.getStartDateFromRange(query.range || 'all');

    const match: any = { order_status: 'delivered' };
    if (startDate) match.order_delivered_at = { $gte: startDate };

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$delivery_address.area', // group by area name
          order_count: { $sum: 1 },
          lat: { $first: '$delivery_address.lat' },
          long: { $first: '$delivery_address.long' },
        },
      },
      {
        $project: {
          area_name: '$_id',
          lat: 1,
          long: 1,
          order_count: 1,
        },
      },
    ];

    const data = await this.model.order.aggregate(pipeline);
    return data.filter((item) => item.lat != null && item.long != null);
  }

  async getStartDateFromRange(range: string): Promise<number | null> {
    const now = dayjs();
    switch (range) {
      case 'weekly':
        return now.subtract(7, 'day').valueOf(); // returns milliseconds
      case 'monthly':
        return now.subtract(1, 'month').valueOf();
      case 'quarterly':
        return now.subtract(3, 'month').valueOf();
      case 'halfyearly':
        return now.subtract(6, 'month').valueOf();
      default:
        return null; // 'all' case: no filtering
    }
  }

  async placeOrderWithWallet(body: OrderPlacedDto, user: any) {
    try {
      const orderPlaced: any = await this.OrderPlaced(
        body,
        user,
        PaymentType.Wallet,
      );

      let id = orderPlaced._id ?? null;
      let order = await this.model.order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }
      if (order.payment_status === 'complete')
        throw new Error('Order already paid');

      const wallet = await this.model.walletModel.findOne({
        customer_id: order.customer_id,
      });
      if (!wallet || wallet.balance < order.total_amount) {
        throw new HttpException(
          {
            error_code: 'Insufficient wallet balance',
            error_description: 'Insufficient wallet balance.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('====>>> wallet ', wallet);

      // Deduct wallet
      wallet.balance -= order.total_amount;
      await wallet.save();

      // if(orderPlaced.order_type == OrderType.Current || orderPlaced.order_type == OrderType.Schedule){

      // Update order
      order.payment_status = PaymentStatus.Complete;
      order.order_status = OrderStatus.OrderPlaced;
      order.payment_type = PaymentType.Wallet;
      order.order_placed_at = new Date().getTime();

      function getOrdinal(n: number) {
        const s = ['th', 'st', 'nd', 'rd'],
          v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      }

      let user_order_count = await this.model.order.countDocuments({
        restaurant_id: order.restaurant_id,
        customer_id: order.customer_id,
        order_status: { $nin: ['cancelled', 'failed', 'pending', null] },
      });
      order.user_order_count = getOrdinal(user_order_count || 1);

      await order.save();

      // Add payment
      await this.model.payment.create({
        order_id: order._id,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        payment_status: 'complete',
        total_amount: order.total_amount,
        payment_type: PaymentType.Wallet,
        paymentGateway: PaymentGateway.WALLET,
      });

      // Earnings calculation
      const pricing = await this.model.appConfiguration.findOne();

      let commission_from_restaurant = 0;
      if (
        pricing.commission_for_restaurant_by ===
        CommissionForRestaurantBy.Percentage
      ) {
        commission_from_restaurant =
          (order.cart_amount * pricing.commission_percentage_for_restaurant) /
          100;
      } else {
        commission_from_restaurant =
          pricing.commission_percentage_for_restaurant;
      }

      const commission_from_driver =
        (order.delivery_fee * pricing.commission_percentage_for_driver) / 100;
      const restaurant_earning = order.cart_amount - commission_from_restaurant;
      const driver_earning = order.delivery_fee + order.tip_amount;

      await this.model.earnings.create({
        reference_id: order.order_id,
        order_id: order._id,
        restaurant_id: order.restaurant_id,
        customer_id: order.customer_id,
        food_amount: order.cart_amount,
        delivery_charge: order.delivery_fee,
        tip_amount: order.tip_amount,
        total_amount: order.total_amount,
        app_commission: pricing.app_commission,
        restaurant_earning,
        driver_earning,
        commission_from_restaurant,
        commission_from_driver,
        tax: order.tax_amount,
        payment_type: PaymentType.Wallet,
        order_placed_at: order.order_placed_at,
        pay_to_vendor: 'pending',
        pay_to_driver: 'pending',
        earning_type: order?.order_type || null,
      });

      // Notify vendor
      const restaurant = await this.model.restaurant
        .findById(order.restaurant_id)
        .populate('vendor_id');
      const sessions = await this.model.session.find({
        user_id: restaurant.vendor_id,
      });

      for (const session of sessions) {
        const push_content = {
          title: 'New Order Received',
          description: 'You have received a new wallet-paid order.',
        };
        const push_data = {
          type: 'order_received',
          order_id: order._id,
        };
        this.commonService.send_notification(
          push_content,
          session.fcm_token,
          push_data,
          restaurant.vendor_id,
        );
      }

      // }

      // Wallet transaction
      await this.model.walletTransactionModel.create({
        customer_id: new Types.ObjectId(order.customer_id),
        amount: order.total_amount,
        debit_type: DebitType.ORDER,
        type: WalletTxnType.DEBIT,
        description: 'Order payment via wallet',
        order_id: order._id,
      });

      return {
        statusCode: 200,
        message: 'Order placed using wallet successfully',
        order: order,
      };
    } catch (error) {
      console.log('error ===========>>>>>>> ', error);
      throw error;
    }
  }

  async getUserRecommendations(customerId: Types.ObjectId) {
    // Step 1: Fetch all delivered orders of the customer with cart_items populated
    const orders = await this.model.order
      .find({
        customer_id: new Types.ObjectId(customerId),
        order_status: 'delivered',
      })
      .populate({
        path: 'cart_items.food_id',
        select: 'name rating',
      })
      .populate({
        path: 'restaurant_id',
      });

    // Step 2: Build a frequency map of food_id with quantity
    const foodMap = new Map<
      string,
      {
        food_id: Types.ObjectId;
        food_name: string;
        food_rating?: number;
        restaurant_id: Types.ObjectId;
        food_images: {};
        restaurant_name?: string;
        order_count: number;
        price: number;
        food_type: string;
        is_available: boolean;
      }
    >();

    for (const order of orders) {
      const restaurant: any = order.restaurant_id;

      for (const item of order.cart_items) {
        const food: any = await this.model.food.findById(item.food_id);
        if (food) {
          const key = food._id.toString();

          if (!foodMap.has(key)) {
            foodMap.set(key, {
              food_id: food,
              food_name: food.name,
              food_images: food.image,
              food_rating: food.rating,
              restaurant_id: restaurant,
              restaurant_name: restaurant?.name,
              order_count: item.no_of_quantity || 0,
              price: food.price || 0,
              food_type: food.food_type,
              is_available: food.is_available,
            });
          } else {
            const existing = foodMap.get(key)!;
            existing.order_count += item.no_of_quantity || 0;
          }
        }
      }
    }

    // Step 3: Convert map to array and sort by order_count
    const results = Array.from(foodMap.values())
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 10);

    return {
      statusCode: 200,
      message: 'Recommendations fetched successfully.',
      result: results,
    };
  }

  async CreateUpcommingOrders() {
    try {
      let today = new Date();
      // local
      // let nowMinutes = today.getHours() * 60 + today.getMinutes();

      let utcHours = today.getUTCHours();
      let utcMinutes = today.getUTCMinutes();
      // utc
      let nowMinutes = utcHours * 60 + utcMinutes;

      // daily order
      let dailyOrders = await this.model.SubscribeOrderModel.find({
        subscription_status: OrderSubscriptionStatus.Active,
        subscription_type: OrderSubscriptionType.Daily,
      }).lean();

      if (dailyOrders.length > 0) {
        for (const order in dailyOrders) {
          let body: any = { ...dailyOrders[order] };
          delete body._id;
          body.order_id = await this.createOrderId();
          body.order_status = OrderStatus.upcomming;
          await this.model.order.create(body);
        }
      }

      // weekly order
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const dayName = days[today.getDay()];

      let weeklyOrder = await this.model.SubscribeOrderModel.find({
        subscription_status: OrderSubscriptionStatus.Active,
        subscription_type: OrderSubscriptionType.Weekly,
        subscription_weekly: { $in: [dayName] },
      }).lean();

      // console.log("==>>>> ",weeklyOrder);

      if (weeklyOrder.length > 0) {
        for (const order in weeklyOrder) {
          let body: any = { ...weeklyOrder[order] };
          delete body._id;
          body.order_id = await this.createOrderId();
          body.order_status = OrderStatus.upcomming;

          await this.model.order.create(body);
        }
      }

      // monthly orders
      let dayOfMonth = today.getDate();
      let monthlyOrder = await this.model.SubscribeOrderModel.find({
        subscription_status: OrderSubscriptionStatus.Active,
        subscription_type: OrderSubscriptionType.Monthly,
        subscription_monthly: { $in: [dayOfMonth] },
      }).lean();

      if (monthlyOrder.length > 0) {
        for (const order in monthlyOrder) {
          let body: any = { ...monthlyOrder[order] };
          delete body._id;
          body.order_id = await this.createOrderId();
          body.order_status = OrderStatus.upcomming;
          await this.model.order.create(body);
        }
      }

      return { status: true, message: 'upcomming order created successfully' };
    } catch (error) {
      console.log('Create Upcomming Orders cron error ====>>>> ', error);
      throw error;
    }
  }

  async HandleUpcommingOrders() {
    try {
      let today = new Date(moment.utc().toISOString());

      let utcHours = today.getUTCHours();
      let utcMinutes = today.getUTCMinutes();
      // utc
      let nowMinutes = utcHours * 60 + utcMinutes;

      let upcommingOrders = await this.model.order.find({
        order_status: OrderStatus.upcomming,
        // createdAt : { $lt : yesterday },
        order_time_in_minutes: { $gte: nowMinutes, $lte: nowMinutes + 5 },
      });

      if (upcommingOrders.length > 0) {
        for (let key in upcommingOrders) {
          let order: any = upcommingOrders[key];

          // payment deduct from wallet
          let wallet = await this.model.walletModel.findOne({
            customer_id: order.customer_id,
          });
          if (wallet && wallet.balance > order.total_amount) {
            wallet.balance = wallet.balance - order.total_amount;
            await wallet.save();

            await this.model.order.updateOne(
              { _id: order._id },
              {
                $set: {
                  order_placed_at: moment.utc().valueOf(),
                  order_status: OrderStatus.OrderPlaced,
                  payment_status: PaymentStatus.Complete,
                },
              },
            );
          } else {
            console.log('Wallet does not have balance', order._id);
          }
        }
      }
    } catch (error) {
      console.log('Handle Upcomming Orders cron error ====>>>> ', error);
      throw error;
    }
  }

  async HandleScheduledOrders() {
    try {
      let today = new Date(moment.utc().toISOString());
      // local
      console.log('== HandleScheduledOrders', today);
      await this.model.order.updateMany(
        {
          order_status: OrderStatus.scheduled,
          scheduled_time: { $lt: today },
        },
        {
          $set: {
            order_status: OrderStatus.OrderPlaced,
          },
        },
      );
    } catch (error) {
      throw error;
    }
  }

  async orderSubscriptions(req: any, dto: orderSubscriptionsListDto) {
    let { page, limit, subscription_status, id } = dto;
    let skip = (page - 1) * limit;
    let filter: any = {};

    if (subscription_status != undefined && subscription_status != null) {
      filter.subscription_status = subscription_status;
    }

    let total = 0;
    let subscriptionOrder = [];
    if (req.payload.scope === UsersType.Vendor) {
      filter.restaurant_id = req.user.restaurant_id;

      total = await this.model.SubscribeOrderModel.countDocuments(filter);
      subscriptionOrder = await this.model.SubscribeOrderModel.find(filter)
        .select(
          'customer_id total_amount cart_items subscription_status delivery_address note_for_restaurant add_delivery_instruction add_receiver_detail subscription_type subscription_monthly subscription_weekly order_time createdAt',
        )
        .populate([
          {
            path: 'customer_id',
            select: 'name email country_code phone image',
          },
        ])
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } else if (req.payload.scope === UsersType.Customer) {
      filter.customer_id = new mongoose.Types.ObjectId(req.payload.user_id);

      total = await this.model.SubscribeOrderModel.countDocuments(filter);
      subscriptionOrder = await this.model.SubscribeOrderModel.find(filter)
        .select(
          'restaurant_id total_amount cart_items delivery_address  subscription_status note_for_restaurant add_delivery_instruction add_receiver_detail subscription_type subscription_monthly subscription_weekly order_time createdAt',
        )
        .populate([
          {
            path: 'restaurant_id',
            select: 'restaurant_name country_code restaurant_phone image',
          },
        ])
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } else if (req.payload.scope === UsersType.Admin) {
      if (id !== undefined && id !== '') {
        let customer = await this.model.customer.findById(id);
        if (customer) {
          filter.customer_id = customer._id;
        }

        let restaurant = await this.model.restaurant.findById(id);
        if (restaurant) {
          filter.restaurant_id = restaurant._id;
        }
      }

      total = await this.model.SubscribeOrderModel.countDocuments(filter);
      subscriptionOrder = await this.model.SubscribeOrderModel.find(filter)
        .select(
          'restaurant_id customer_id total_amount cart_items delivery_address  subscription_status note_for_restaurant add_delivery_instruction add_receiver_detail subscription_type subscription_monthly subscription_weekly order_time createdAt',
        )
        .populate([
          {
            path: 'restaurant_id',
            select: 'restaurant_name country_code restaurant_phone image',
          },
          {
            path: 'customer_id',
            select: 'name email country_code phone image',
          },
        ])
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    }

    return { total: total, data: subscriptionOrder };
  }

  async orderSubscriptionsStatus(req: any, dto: orderSubscriptionsStatusDto) {
    let { subscription_status, id } = dto;

    let subscription = await this.model.SubscribeOrderModel.findById(id);
    if (!subscription) {
      throw new BadRequestException('subscription not found');
    }

    subscription.subscription_status = subscription_status;
    await subscription.save();

    let push_content = {
      title: '',
      description: '',
    };

    if (req.payload.scope == UsersType.Customer) {
      // for notification

      let restaurant = await this.model.restaurant.findById(
        subscription.restaurant_id,
      );

      let session = await this.model.session.find({
        user_id: restaurant?.vendor_id ?? null,
      });

      if (session.length > 0) {
        for (const fcm of session) {
          if (subscription_status == OrderSubscriptionStatus.Cancel) {
            push_content.title = 'Subscription cancelled';
            push_content.description = 'subscription is cancelled by customer';
          }

          if (subscription_status == OrderSubscriptionStatus.Active) {
            push_content.title = 'Subscription start';
            push_content.description = 'subscription is start by customer';
          }

          if (subscription_status == OrderSubscriptionStatus.Pause) {
            push_content.title = 'Subscription Paused';
            push_content.description = 'subscription is Paused by customer';
          }

          let push_data = {
            type: 'subscription_update',
            subscription_order_id: subscription._id.toString(),
          };

          this.commonService.send_notification(
            push_content,
            fcm?.fcm_token ?? '',
            push_data,
            subscription?.customer_id ?? '',
          );
        }
      }
    } else if (
      req.payload.scope == UsersType.Vendor ||
      req.payload.scope == UsersType.Admin
    ) {
      // for notification
      let session = await this.model.session.find({
        user_id: subscription?.customer_id ?? null,
      });

      if (session.length > 0) {
        for (const fcm of session) {
          if (subscription_status == OrderSubscriptionStatus.Cancel) {
            push_content.title = 'Subscription cancelled';
            push_content.description =
              'Your subscription is cancelled by restaurant';
          }

          let push_data = {
            type: 'subscription_update',
            subscription_order_id: subscription._id.toString(),
          };

          this.commonService.send_notification(
            push_content,
            fcm?.fcm_token ?? '',
            push_data,
            subscription?.customer_id ?? '',
          );
        }
      }
    }

    return { status: true, message: 'subscription update successfully' };
  }

  async cancelSubscriptonOrder(req: any, id: string) {
    return await this.model.order.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });
  }

  async porterStatusonOrder(body: any, req: any) {
    console.log('porterStatusonOrder ======', body);
    console.log('req.response ======', req?.response ?? '');

    return { data: true };
  }

  async orderListingForSuperDuberAdmin(body) {
    try {
      const skip = (body.page - 1) * body.limit;

      let query: any = {};
      let searchQuery: any = {};
      let dateFilter: any = {};

      if (body.search) {
        searchQuery = {
          order_id: { $regex: body.search, $options: 'i' },
        };
      }

      switch (body.status) {
        case Status.Active:
          query.order_status = {
            $in: [
              OrderStatus.OrderPlaced,
              OrderStatus.OrderConfirmed,
              OrderStatus.PickedUp,
              OrderStatus.OutForDelivery,
              OrderStatus.ReadyForPickup,
            ],
          };
          break;

        case Status.Completed:
          query.order_status = OrderStatus.Delivered;
          break;

        case Status.cancelled:
          query.order_status = OrderStatus.Cancelled;
          break;

        case Status.failed:
          query.order_status = OrderStatus.Failed;
          break;

        case Status.pos:
          query.order_status = OrderStatus.pos;
          break;
      }

      const now = new Date();

      if (body.start_date && body.end_date) {
        const startDate = new Date(Number(body.start_date));
        const endDate = new Date(Number(body.end_date));
        endDate.setHours(23, 59, 59, 999);

        if (startDate > endDate) {
          throw new Error('start date must be less than or equal to end date');
        }
        dateFilter.created_at = {
          $gte: startDate,
          $lte: endDate,
        };
      } else {
        let startDate: Date | null = null;

        switch (body.range) {
          case 'weekly':
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
            break;

          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;

          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;

          case 'all':
          default:
            startDate = null;
        }

        if (startDate) {
          query.created_at = {
            $gte: startDate,
            $lte: now,
          };
        }
      }

      const finalQuery = { ...query, ...searchQuery, ...dateFilter };

      const data = await this.model.order
        .find(finalQuery)
        .select({
          order_id: 1,
          created_at: 1,
          deliver_type: 1,
          delivery_address: 1,
          order_placed_at: 1,
          order_status: 1,
          payment_status: 1,
          refund_at: 1,
        })
        .populate({ path: 'customer_id', select: 'name' })
        .populate({ path: 'driver_id', select: 'name' })
        .populate({
          path: 'restaurant_id',
          select: 'restaurant_name address',
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(body.limit);

      const data_count = await this.model.order.countDocuments(finalQuery);
      const deliver_orders = await this.model.order.countDocuments({
        order_status: OrderStatus.Delivered,
      });
      const auto_renew_orders =
        await this.model.orderSubscripition.countDocuments();

      return {
        data_count,
        auto_renew_orders: auto_renew_orders,
        deliver_orders: deliver_orders,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  async assignFixedTimeOrderTotheDriverByCron() {
    let appconfig = await this.model.appConfiguration.findOne();
    if (appconfig.is_fixed_time_delivery) {
      const zones = await this.model.ServiceLocationModel.find({
        status: 'ACTIVE',
        is_global: false,
        polygon_coordinates: { $ne: null },
      });
      const MAX_ORDERS_PER_DRIVER = 50;

      if (zones.length > 0) {
        for (const zone of zones) {
          let orders = await this.model.order
            .find({
              zone_id: zone._id,
              order_status: {
                $in: [OrderStatus.OrderPlaced, OrderStatus.OrderConfirmed],
              },
              payment_status: PaymentStatus.Complete,
              driver_id: null,
            })
            .sort({ createdAt: 1 });

          let drivers = await this.model.driver.find({
            zone_id: zone._id,
          });

          console.log('ordre ===>>> ', drivers);

          let driverIndex = 0;
          let orderCountForDriver = 0;

          for (const order of orders) {
            if (driverIndex >= drivers.length) {
              break; // no more drivers available
            }

            const currentDriver = drivers[driverIndex];

            await this.model.order.updateOne(
              { _id: order._id },
              {
                $set: {
                  driver_id: currentDriver._id,
                  is_open_for_driver: false,
                  order_status: RiderStatus.PickedUp,
                  rider_status: RiderStatus.PickedUp,
                  order_picked_up_at: moment.utc().valueOf(),
                },
              },
            );

            orderCountForDriver++;

            // After 50 orders, move to next driver
            if (orderCountForDriver >= MAX_ORDERS_PER_DRIVER) {
              driverIndex++;
              orderCountForDriver = 0;
            }
          }
        }
      }
    }

    return { data: appconfig.is_fixed_time_delivery };
  }
}
