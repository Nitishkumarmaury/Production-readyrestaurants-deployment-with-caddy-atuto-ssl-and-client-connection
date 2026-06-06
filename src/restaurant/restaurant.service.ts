import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { RestaurantAggregation } from './restaurant.aggregation';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as moment from 'moment';
import mongoose, { Types } from 'mongoose';
import {
  AddDiscountDto,
  CreateRestaurantServiceDto,
  dineOutListDto,
  DineOutSortBy,
  GetRestaurantServiceDto,
  QRCodeDto,
  restaurant_request_list_dto,
  Slots,
  UpdateRestaurantDto,
  UpdateRestaurantRequestDto,
  UpdateRestaurantServiceDto,
} from './dto/restaurant.dto';
import { SelectDriversDto } from './dto/select-drivers.dto';
import { restaurantStatus } from './schema/restaurant.schema';
import { OrderStatus, PaymentStatus } from 'src/order/schema/order.schema';
import { recent_order_list } from 'src/order/dto/order.dto';
import { ResponseMapper } from '../common/utils/response-mapper.util'; // Import
import { EmbeddingService } from 'src/embedding/embedding.service';
import { featuresListDto } from 'src/customer/dto/customer.dto';
import { SlotService } from 'src/slot/slot.service';
import { IS_ALPHA } from 'class-validator';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { EarningType } from 'src/earning/schema/earning.schema';
import { AppService } from 'src/app.service';
import { SubscriptionCheckService } from 'src/common/subscription-check.service';
@Injectable()
export class RestaurantService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly restaurantAggregation: RestaurantAggregation,
    private readonly embeddingService: EmbeddingService,
    private readonly SlotService: SlotService,

    private readonly appService: AppService,
    private readonly SubscriptionPlansCheckService: SubscriptionCheckService,

  ) {}
  async create(body, req) {
    try {
      let language = req.headers['language'] || 'english';


      await this.SubscriptionPlansCheckService.subscriptionPlansCheck(req);


      let data = {
        phone: body.restaurant_phone,
        country_code: body.country_code,
        is_phone_verify: true,
        is_active: true,
        login_type: 'normal',
        device_type: 'android',
        created_at: moment.utc().valueOf(),
        is_email_verify: true,
      };

      const vendor = await this.model.vendor.create(data);
      let vendor_id = vendor._id;

      const restaurantData: any = {
        ...body,
        vendor_id,

        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        is_deleted: false,
        restaurant_type: body.restaurant_type,

        // is_restaurant_verified
      };

      if (body.restaurant_type == RestaurantType.Grocery) {
        restaurantData.isFoodDelivery = true;
        restaurantData.is_delivery_available = true;
      }

      if (body?.restaurant_phone) {
        let fetch_restaurant = await this.model.restaurant.findOne({
          restaurant_phone: body.restaurant_phone,
        });
        let fetch_vendor = await this.model.vendor.findOne({
          phone: body.restaurant_phone,
          _id: { $ne: new Types.ObjectId(vendor_id) },
        });
        if (fetch_restaurant || fetch_vendor) {
          let key = 'phone_exist';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      if (body.address) {
        const latlong: any = body.address;
        restaurantData.location = {
          type: 'Point',
          coordinates: [parseFloat(latlong.long), parseFloat(latlong.lat)],
        };
      }

      if (
        restaurantData.services !== undefined &&
        restaurantData.services.length > 0
      ) {
        restaurantData.services = restaurantData.services.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
      }

      if (
        restaurantData.amenities !== undefined &&
        restaurantData.amenities.length > 0
      ) {
        restaurantData.amenities = restaurantData.amenities.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
      }

      const restaurant: any =
        await this.model.restaurant.create(restaurantData);

      try {
        const embedding = await this.embeddingService.generateEmbedding(
          `${restaurant.restaurant_name} ${restaurant.description || ''} ${restaurant.address || ''}`,
        );

        await this.model.EmbeddingModel.create({
          restaurant_id: restaurant._id,
          vector: embedding,
          source: 'restaurant',
        });
      } catch (embeddingError) {
        console.error(
          'Failed to generate restaurant embedding:',
          embeddingError,
        );
      }

      await this.model.vendor.updateOne(
        { _id: vendor_id },
        {
          name: body.owner_name,
          email: body.email,
          is_detail_added: true,
          restaurant_id: restaurant._id,
          image: body.image,
        },
        { lean: true },
      );

      const populatedRestaurant = await this.model.restaurant
        .findById(restaurant._id)
        .populate('vendor_id');

      return { data: populatedRestaurant };
    } catch (error) {
      throw error;
    }
  }

  // async Update(body: UpdateRestaurantDto, restaurant_id: string, req: any) {
  //   try {
  //     let language = req.headers['language'] || 'english';
  //     const user_info = req.user;
  //     let query = {}
  //     const validate_restro_number = await this.model.restaurant.findOne({ restaurant_phone: body.restaurant_phone, vendor_id: { $ne: new Types.ObjectId(user_info._id) } });
  //     if (validate_restro_number) {
  //       let key = 'phone_exist';
  //       const localization = await this.commonService.localization(key);
  //       throw new HttpException(
  //         {
  //           error_code: localization[language],
  //           error_description: localization[language],
  //           message: localization[language],
  //         },
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }
  //     let restaurant = await this.model.restaurant.findOne({ _id: restaurant_id })
  //     if (body.address || body.restaurant_name != restaurant.restaurant_name) {
  //       if (restaurant.is_restaurant_verified != null) {
  //         query = { ...body, is_restaurant_update: true, is_restaurant_verified: false, doc_update_verification: RestaurantVerificationStatus.SUBMITTED, updated_at: moment.utc().valueOf() }
  //       }
  //       else {
  //         query = { ...body, updated_at: moment.utc().valueOf() }
  //       }
  //     }
  //     else {
  //       query = { ...body, updated_at: moment.utc().valueOf() }
  //     }

  //     const update = await this.model.restaurant
  //       .findOneAndUpdate({ _id: restaurant_id }, query, { new: true })
  //       .populate('vendor_id');

  //     body.owner_name
  //       ? await this.model.vendor.updateOne(
  //         { _id: user_info._id },
  //         { name: body.owner_name },
  //       )
  //       : null;

  //     body.email
  //       ? await this.model.vendor.updateOne(
  //         { _id: user_info._id },
  //         { email: body.email },
  //       )
  //       : null;

  //     body.address
  //       ? await this.model.vendor.updateOne(
  //         { _id: user_info._id },
  //         { is_address_added: true },
  //       )
  //       : null;

  //     body.working_day
  //       ? await this.model.vendor.updateOne(
  //         { _id: user_info._id },
  //         { is_timing_added: true },
  //       )
  //       : null;

  //     return { data: update };
  //   } catch (error) {
  //     console.log('error', error);
  //     throw error;
  //   }
  // }

  async Update_(body: UpdateRestaurantDto, restaurant_id: string, req: any) {
    try {
      console.log('body', body);
      const language: string = req.headers['language'] ?? 'english';
      const user_info = req.user;
      const updated_at = moment.utc().valueOf();

      let { restaurant_phone } = body;

      if (restaurant_phone !== undefined && restaurant_phone !== '') {
        const existingRestaurant = await this.model.restaurant.findOne({
          restaurant_phone: restaurant_phone,
          vendor_id: { $ne: new Types.ObjectId(user_info._id) },
        });

        if (existingRestaurant) {
          const localization =
            await this.commonService.localization('phone_exist');
          throw new HttpException(
            {
              error_code: localization[language],
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const restaurant = await this.model.restaurant.findOne({
        _id: restaurant_id,
      });
      if (!restaurant)
        throw new HttpException(
          'Restaurant not found. Please check the details and try again.',
          HttpStatus.NOT_FOUND,
        );

      let query: Record<string, any> = { ...body, updated_at };
      if (
        body.dine_out_working_day !== undefined &&
        body.dine_out_working_day.length > 0
      ) {
        restaurant.dine_out_working_day = body.dine_out_working_day;
        if (body.maximum_capacity_slot !== undefined)
          restaurant.maximum_capacity_slot = body.maximum_capacity_slot;
        if (body.buffer_time !== undefined)
          restaurant.buffer_time = body.buffer_time;
        if (body.isDineOut !== undefined) restaurant.isDineOut = body.isDineOut;

        await restaurant.save();

        let slotcount = await this.model.SlotModel.countDocuments({
          restaurant_id: restaurant._id,
        });
        if (restaurant.isDineOut == true && slotcount <= 0) {
          await this.SlotService.createSlot(restaurant);
        }
      }

      query.is_profile_completed = true;
      if (body.address) {
        query.is_restaurant_update = true;
      }

      if (body.address) {
        const latlong: any = body.address;
        query.location = {
          type: 'Point',
          coordinates: [parseFloat(latlong.long), parseFloat(latlong.lat)],
        };
      }

      if (
        body.is_delivery_available == true ||
        body.is_delivery_available == false
      ) {
        query.isFoodDelivery = body.is_delivery_available;
      }

      const update = await this.model.restaurant
        .findOneAndUpdate({ _id: restaurant_id }, query, { new: true })
        .populate('vendor_id');

      if (!update)
        throw new HttpException(
          `Failed to update restaurant details. Please try again.`,
          HttpStatus.BAD_REQUEST,
        );

      const vendorUpdates: Record<string, any> = {};
      if (body.owner_name) vendorUpdates.name = body.owner_name;
      if (body.email) vendorUpdates.email = body.email;
      if (body.address) vendorUpdates.is_address_added = true;
      if (body.image) vendorUpdates.image = body.image;
      if (body.working_day) vendorUpdates.is_timing_added = true;

      if (body.address) {
        const latlong: any = body.address;
        vendorUpdates.location = {
          type: 'Point',
          coordinates: [parseFloat(latlong.long), parseFloat(latlong.lat)],
        };
      }

      if (Object.keys(vendorUpdates).length > 0) {
        await this.model.vendor.updateOne(
          { _id: user_info._id },
          vendorUpdates,
        );
      }

      return { data: update };
    } catch (error) {
      console.error('Error in Update function:', error);
      throw error;
    }
  }

  async find(id: string): Promise<{ data: any } | null> {
    try {
      const data = await this.model.restaurant
        .findOne({ _id: id })
        .populate({ path: 'vendor_id' });

      if (!data) throw new Error('Restaurant not found');

      return { data };
    } catch (error) {
      console.error('Error in find function:', error);
      throw error;
    }
  }

  async findAll(id: string): Promise<{ data: any[] }> {
    try {
      const data = await this.model.restaurant.find({ vendor_id: id });

      if (!data.length) throw new Error('No restaurants found for this vendor');

      return { data };
    } catch (error) {
      console.error('Error in findAll function:', error);
      throw error;
    }
  }

  async goOnline(
    restaurant_id: string,
    status: string,
  ): Promise<{ message: string }> {
    try {
      await this.model.restaurant.updateOne({ _id: restaurant_id }, { status });

      return { message: 'Status updated successfully' };
    } catch (error) {
      console.error('Error in goOnline function:', error);
      throw error;
    }
  }

  async submitRestaurantVerification(user) {
    try {
      await this.model.vendor.updateOne(
        { _id: user._id },
        { is_verfication_submitted: true },
      );
      // await this.model.restaurant.updateOne(
      //   { vendor_id: user._id },
      //   { is_submit_verification: true, verification: RestaurantVerificationStatus.SUBMITTED },
      // );
      return { message: 'Successfully submitted' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async restuarantAdminListing(body, user) {
    try {
      let query: any = {};
      let options = await this.commonService.set_options(body.page, body.limit);
      let searchQuery = {};
      if (body.search) {
        searchQuery = {
          $or: [
            { restaurant_name: { $regex: body.search, $options: 'i' } },
            { restaurant_phone: { $regex: body.search, $options: 'i' } },
          ],
        };
      }
      body.status === 'active'
        ? (query = {
            is_active: true,
            is_block: false,
            is_restaurant_verified: true,
            is_deleted: false,
          })
        : null;
      body.status === 'block'
        ? (query = {
            // is_active: true,
            is_block: true,
            is_deleted: false,
          })
        : null;

      body.status === 'delete'
        ? (query = {
            // is_active: true,
            is_deleted: true,
            // is_restaurant_verified: true,
          })
        : null;

      if (body.restaurant_type) {
        query.restaurant_type = body.restaurant_type;
      }

      let data_to_aggregate = [
        await this.restaurantAggregation.match(query, searchQuery),
        await this.restaurantAggregation.VendorLookup(),
        await this.restaurantAggregation.OrderLookup(),
        await this.restaurantAggregation.addFieldsCount(),

        await this.restaurantAggregation.lookupEarning(),

        {
          $addFields: {
            total_restaurant_earning: {
              $sum: '$earnings.commission_from_restaurant',
            },
          },
        },

        await this.restaurantAggregation.project(),
        await this.restaurantAggregation.face_set(options),
      ];
      let data = await this.model.restaurant.aggregate(data_to_aggregate);
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map((item) =>
            isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item,
          )
        : [];

      let total_restaurant_earning =
        data[0]?.total_restaurant_earnings[0]?.total_restaurant_earning ?? 0;
      return {
        count: data[0]?.count[0]?.count,
        total_restaurant_earning: total_restaurant_earning,
        data: maskedData,
      };

      // return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async restaurant_admin_listing_select_for_quick_picks(body) {
    try {
      const { page, limit, search } = body;

      let query = {};

      if (search) {
        query = {
          $or: [
            { restaurant_name: { $regex: search, $options: 'i' } },
            { restaurant_phone: { $regex: search, $options: 'i' } },
          ],
        };
      }

      query = {
        ...query,
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        is_quick_pick: false,
      };

      const options = await this.commonService.set_options(
        page || 1,
        limit || 10,
      );
      const restaurants = await this.model.restaurant.find(
        query,
        { _id: 1, restaurant_name: 1, restaurant_phone: 1, is_quick_pick: 1 },
        options,
      );

      const restaurants_count =
        await this.model.restaurant.countDocuments(query);

      return { count: restaurants_count || 0, data: restaurants };
    } catch (error) {
      console.error(
        'Error in restaurant_admin_listing_select_for_quick_picks:',
        error,
      );
      throw error;
    }
  }

  async restuarantRequestListing(body) {
    try {
      let query = {};
      let options = await this.commonService.set_options(body.page, body.limit);
      let searchQuery = {};
      body.search
        ? (searchQuery = {
            restaurant_name: { $regex: body.search, $options: 'i' },
          })
        : null;
      body.status === 'pending'
        ? (query = {
            is_restaurant_verified: null,
            is_submit_verification: true,
          })
        : null;
      body.status === 'rejected' || body.status === 'reject'
        ? (query = {
            is_restaurant_verified: false,
            is_restaurant_update: false,
          })
        : null;
      let data_to_aggregate = [
        await this.restaurantAggregation.match(query, searchQuery),
        await this.restaurantAggregation.VendorLookup(),
        await this.restaurantAggregation.unwindVendor(),

        await this.restaurantAggregation.project(),
        await this.restaurantAggregation.face_set(options),
      ];
      let data = await this.model.restaurant.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async restaurantDetailForAdmin(id) {
    try {
      const data: any = await this.model.restaurant
        .findOne({ _id: id })
        .populate([{ path: 'vendor_id' }, { path: 'report_reason_id' }]);

      let bank_detail = await this.model.bank.findOne({
        vendor_id: data.vendor_id,
      });
      let check_category = await this.model.food
        .find({ restaurant_id: id }, { category_id: 1 })
        .populate([{ path: 'category_id' }]);
      let uniqueCategories = Array.from(
        new Set(check_category.map((food) => food.category_id)),
      );

      // Get the full category details for unique category IDs
      let category = await this.model.category.find({
        _id: { $in: uniqueCategories },
      });

      const review = await this.model.review
        .find({ restaurant_id: id })
        .sort({ _id: -1 })
        .limit(5)
        .populate({
          path: 'customer_id',
          select: 'name',
        })
        .populate({
          path: 'order_id',
          select: '_id order_id',
        });

      data.bank_account_number = bank_detail?.account_number || null;
      data.category = category || null;

      const banners = await this.model.RestaurantBannerModel.find({
        restaurant_id: data._id,
      });

      let total_reports = await this.model.reports.countDocuments({
        restaurant_id: data._id,
      });

      return {
        data: {
          ...data.toObject(), // Ensures compatibility when adding new keys
          bank_account_number: bank_detail?.account_number || null,
          category: category || null,
          review: review || [],
          total_orders: data.total_orders || 0,
          banners: banners,
          total_reports: total_reports,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async updateRestaurantRequest(_id: string, body: UpdateRestaurantRequestDto) {
    try {
      const { is_update, status, reason } = body;

      let restaurant = null;
      const updateData: any = {
        is_restaurant_verified: status === 'accept',
        is_restaurant_update: is_update ? true : false,
      };

      if (is_update === true) {
        // updateData.doc_update_verification = status === 'accept' ? RestaurantVerificationStatus.APPROVED : RestaurantVerificationStatus.REJECTED;
        // if (status === 'accept') {
        //   updateData.verification = RestaurantVerificationStatus.APPROVED;
        // }
      }

      if (is_update === false) {
        // updateData.verification = status === 'accept' ? RestaurantVerificationStatus.APPROVED : RestaurantVerificationStatus.REJECTED;
        // updateData.doc_update_verification = status === 'accept' ? RestaurantVerificationStatus.APPROVED : RestaurantVerificationStatus.REJECTED;
      }

      if (status !== 'accept') updateData.reason = reason;

      restaurant = await this.model.restaurant
        .findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData, {
          new: true,
        })
        .populate([{ path: 'vendor_id' }]);

      if (!restaurant) {
        return { message: 'Restaurant not found or update failed.' };
      }

      if (status === 'accept') {
        // check  expiry date conditon

        let documents = await this.model.UplodedDocumentModel.find({
          restaurant_id: restaurant._id,
        }).populate('requirement_id');

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
      }

      const user = await this.model.vendor.findOne(
        { _id: restaurant.vendor_id },
        {},
        { lean: true },
      );

      const session = await this.model.session.findOne(
        { user_id: restaurant.vendor_id },
        { fcm_token: 1 },
      );

      const notificationData = await this.getNotificationData(
        status,
        user.preferred_language,
      );

      if (session?.fcm_token) {
        this.commonService.send_notification(
          notificationData,
          session.fcm_token,
          { type: 'admin' },
          restaurant.vendor_id,
        );
      }

      if (status === 'accept') {
        // clear solt for dine out
        // if(restaurant.isDineOut == true){
        //   this.SlotService.createSlot(restaurant);
        // }
        await this.sentEmailToRestaurantApproval(restaurant);
        return { message: 'Restuarant account has been approved successfully' };
      }
      // if (status === 'reject')
      else {
        await this.sentEmailToRestaurantReject(restaurant, body);
        return { message: 'Restuarant account has been rejected successfully' };
      }

      return { message: 'Invalid status' };
    } catch (error) {
      throw error;
    }
  }

  async getNotificationData(status: string, language: string) {
    const titleKey = 'admin';
    const descriptionKey =
      status === 'accept'
        ? 'accept_restaurant_description'
        : 'reject_restaurant_description';

    const localizationTitle = await this.commonService.localization(titleKey);
    const localizationDescription =
      await this.commonService.localization(descriptionKey);

    return {
      title: localizationTitle[language],
      description: localizationDescription[language],
    };
  }

  async sentEmailToRestaurantApproval(update) {
    try {
      try {
        const baseUrl = process.env.BaseUrl;

        let file_path = path.join(
          __dirname,
          '../../dist/emails/approve-rest.hbs',
        );
        let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
        const template = Handlebars.compile(html);
        const data = {
          baseUrl: baseUrl,
          driverName: update?.restaurant_name || 'restaurant',
        };
        const htmlToSend = template(data);

        let mailData = {
          to: update.vendor_id.email,
          subject: `Your Restaurant Has Been Approved`,
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
    } catch (error) {
      throw error;
    }
  }
  async sentEmailToRestaurantReject(update, body) {
    try {
      let file_path = path.join(__dirname, '../../dist/emails/reject-rest.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        driverName: update?.restaurant_name,
        reason: body.reason,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: update.vendor_id.email,
        subject: `Your Restaurant Has Been Rejected`,
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

  async Block(body) {
    try {
      let update: any = await this.model.restaurant
        .findOneAndUpdate(
          { _id: body.restaurant_id },
          {
            is_block: body.status === 'block' ? true : false,
            reason: body?.reason,
          },
        )
        .populate([{ path: 'vendor_id' }]);

      if (update && body.status === 'block') {
        let user_id = update.vendor_id._id;
        await this.sentEmailToRestaurantBlock(update, body);
        await this.model.session.deleteMany({
          user_id: new Types.ObjectId(user_id),
        });
      }
      body.status === 'unblock' &&
        (await this.sentEmailToRestaurantUnblock(update));

      return { message: 'status successfully updated' };
    } catch (error) {
      throw error;
    }
  }

  async sentEmailToRestaurantBlock(update, body) {
    try {
      let file_path = path.join(__dirname, '../../dist/emails/rest_block.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        restaurant_name: update?.restaurant_name || 'restuarant',
        reason: body.reason,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: update.vendor_id.email,
        subject: `Your Restaurant Has Been Blocked`,
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

  async sentEmailToRestaurantUnblock(update) {
    try {
      let file_path = path.join(
        __dirname,
        '../../dist/emails/rest_unblock.hbs',
      );
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        restaurant_name: update?.restaurant_name,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: update.vendor_id.email,
        subject: `Your Restaurant Has Been Unblocked`,
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
  catch(error) {
    throw error;
  }

  async restaurantOrders(body) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);

      let data_to_aggregate: any = [
        await this.restaurantAggregation.restaurantMatch(body.restaurant_id),
        await this.restaurantAggregation.customerLookUp(),
        await this.restaurantAggregation.unwindCustomer(),
        await this.restaurantAggregation.driverLookUp(),
        await this.restaurantAggregation.unwindDriver(),

        await this.restaurantAggregation.lookupOrderEarning(),

        {
          $addFields: {
            total_earning: {
              $sum: {
                $map: {
                  input: '$earnings',
                  as: 'e',
                  in: {
                    $subtract: [
                      {
                        $add: [
                          { $ifNull: ['$$e.commission_from_restaurant', 0] },
                          { $ifNull: ['$$e.commission_from_driver', 0] },
                        ],
                      },
                      { $ifNull: ['$$e.coupon_amount', 0] },
                    ],
                  },
                },
              },
            },
          },
        },

        await this.restaurantAggregation.orderProject(),

        await this.restaurantAggregation.face_set(options),
      ];
      let data = await this.model.order.aggregate(data_to_aggregate);

      let total_order_earning =
        data[0]?.total_order_earning[0]?.total_earning || 0;

      return {
        count: data[0]?.count[0]?.count,
        total_order_earning: total_order_earning,
        data: data[0]?.data,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async restaurant_earnings(body) {
    try {
      const { restaurant_id } = body;

      // Fetch restaurant earnings in one query
      const restaurant_earnings = await this.model.earnings.find({
        restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
      });

      const weeklyData = restaurant_earnings.reduce((acc, data) => {
        const createdAt = moment(data.created_at);
        const startOfWeek = createdAt.clone().startOf('week'); // Start of week (Sunday)
        const endOfWeek = createdAt.clone().endOf('week'); // End of week (Saturday)

        const weekKey = `${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`;

        if (!acc[weekKey]) {
          acc[weekKey] = {
            no_of_orders: 0,
            food_amount: 0,
            app_commission: 0,
            total_amount_to_be_paid: 0,
            restaurant_earning: 0,
          };
        }

        acc[weekKey].no_of_orders += 1;
        acc[weekKey].food_amount += data.food_amount;
        acc[weekKey].app_commission += data.commission_from_restaurant;
        acc[weekKey].restaurant_earning += data?.restaurant_earning || 0;

        console.log('==>Ee ', data?.restaurant_earning);

        return acc;
      }, {});

      const formattedData = Object.keys(weeklyData).map((weekKey) => {
        const [startOfWeek, endOfWeek] = weekKey.split(' to ');
        const weekData = weeklyData[weekKey];
        weekData.total_amount_to_be_paid = weekData.restaurant_earning;
        return {
          week_start: moment(startOfWeek).valueOf(),
          week_end: moment(endOfWeek).valueOf(),
          no_of_orders: weekData.no_of_orders,
          food_amount: parseFloat(weekData.food_amount.toFixed(2)),
          app_commission: parseFloat(weekData.app_commission.toFixed(2)),
          total_amount_to_be_paid: parseFloat(
            weekData.total_amount_to_be_paid.toFixed(2),
          ),
        };
      });

      return { data: formattedData };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async restaurant_menu(body) {
    try {
      const skip = (body.page - 1) * body.limit;

      // Fetch the food items and populate the category details
      const foodItems: any = await this.model.food
        .find({ restaurant_id: body.restaurant_id })
        .sort({ created_at: -1 })
        .populate('category_id');

      // Filter out food items with missing category
      const filteredFoodItems = foodItems.filter((food) => food.category_id);

      const menu = {};
      const categorySet = new Set(); // To track unique categories

      filteredFoodItems.forEach((food) => {
        const categoryName = food.category_id.category_name;
        categorySet.add(categoryName);

        if (!menu[categoryName]) {
          menu[categoryName] = {
            category: categoryName,
            items: [],
          };
        }
        menu[categoryName].items.push({
          name: food.name,
          price: food.price,
          discounted_price: food.discounted_price,
          description: food.description,
        });
      });

      // Convert the grouped data into an array format
      const formattedMenu = Object.values(menu);

      const paginatedCategories = formattedMenu.slice(skip, skip + body.limit);

      // Count unique categories
      const data_count = categorySet.size;

      return { data_count, data: paginatedCategories };
    } catch (error) {
      console.error('Error in restaurant_menu:', error);
      throw error;
    }
  }

  async restaurant_updated(body) {
    try {
      let query = {};
      let options = await this.commonService.set_options(body.page, body.limit);
      let searchQuery = {};
      body.search
        ? (searchQuery = {
            restaurant_name: { $regex: body.search, $options: 'i' },
          })
        : null;

      query = { is_restaurant_verified: false, is_restaurant_update: true };

      if (body.status === 'reject') {
        query = {
          is_restaurant_verified: false,
          is_submit_verification: true,
          is_restaurant_update: false,
        };
      }

      let data_to_aggregate = [
        await this.restaurantAggregation.match(query, searchQuery),
        await this.restaurantAggregation.VendorLookup(),
        await this.restaurantAggregation.project(),
        await this.restaurantAggregation.face_set_sort_update(options),
      ];
      let data = await this.model.restaurant.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async restuarant_list_all(body: restaurant_request_list_dto) {
    try {
      const { page, limit, search, type } = body;
      const options = await this.commonService.set_options(
        body.page,
        body.limit,
      );
      let query = {};
      let searchQuery = {};

      body.search
        ? (searchQuery = {
            restaurant_name: { $regex: body.search, $options: 'i' },
          })
        : null;

      if (type === 'new') {
        query = {
          is_restaurant_verified: null,
          is_submit_verification: true,
          is_restaurant_update: null,
        };
      }

      if (type === 'new' && (status === 'rejected' || status === 'reject')) {
        query = { is_restaurant_verified: false, is_submit_verification: true };
      }

      if (type === 'update') {
        query = { is_restaurant_verified: false, is_restaurant_update: true };
      }

      if (type === 'update' && (status === 'rejected' || status === 'reject')) {
        query = {
          is_restaurant_verified: false,
          is_submit_verification: true,
          is_restaurant_update: false,
        };
      }

      let data_to_aggregate = [
        await this.restaurantAggregation.match(query, searchQuery),
        await this.restaurantAggregation.VendorLookup(),
        await this.restaurantAggregation.unwindVendor(),

        await this.restaurantAggregation.project(),
        await this.restaurantAggregation.face_set(options),
      ];
      let data = await this.model.restaurant.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async restaurant_list_all(body: restaurant_request_list_dto, user) {
    try {
      const { page, limit, search, type } = body;
      const options = await this.commonService.set_options(page, limit);

      let query = {};
      let searchQuery = {};

      // Search filter
      if (search) {
        searchQuery = {
          $or: [
            { restaurant_name: { $regex: search, $options: 'i' } },
            { restaurant_phone: { $regex: search, $options: 'i' } },
          ],
        };
      }

      // Status-based filtering
      // if (type === 'requested') {
      //   query = { verification: status };

      // } else if (type === 'updated') {
      //   query = { doc_update_verification: status };
      // }

      if (type === 'requested') {
        query = {
          verification: status,
          is_deleted: false,
          is_verfication_submitted: true,
        };
      } else if (type === 'updated') {
        query = {
          doc_update_verification: status,
          is_deleted: false,
        };
      }

      const data_to_aggregate = [
        await this.restaurantAggregation.match(query, searchQuery),
        await this.restaurantAggregation.VendorLookup(),
        await this.restaurantAggregation.unwindVendor(),
        await this.restaurantAggregation.project(),
        await this.restaurantAggregation.face_set_sort_update(options),
      ];
      let data = await this.model.restaurant.aggregate(data_to_aggregate);
      // Mask sensitive fields here
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map((item) =>
            isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item,
          )
        : [];
      return {
        count: data?.[0]?.count?.[0]?.count || 0,
        data: maskedData, //data?.[0]?.data || [],
      };
    } catch (error) {
      throw error;
    }
  }

  recentOrderListsByRestaurantId = async (
    restaurant_id: string,
    body: recent_order_list,
  ) => {
    try {
      let { page, limit, search } = body;

      page = Number(body.page) || 1;
      limit = Number(body.limit) || 10;
      const skip = (page - 1) * limit;

      const finalQuery = {
        restaurant_id: restaurant_id,
        payment_status: 'complete',
      };

      const data = await this.model.order
        .find(finalQuery)
        .populate({ path: 'customer_id', select: 'name' })
        .populate({ path: 'driver_id', select: 'name' })
        .populate({ path: 'restaurant_id', select: 'restaurant_name address' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      let orders = await this.model.order
        .find(finalQuery)
        .populate([
          { path: 'restaurant_id' },
          { path: 'customer_id' },
          { path: 'driver_id' },
        ])
        .skip(skip)
        .limit(body.limit)
        .sort({ order_placed_at: -1 });
      const data_count = await this.model.order.countDocuments(finalQuery);

      return {
        count: data_count,
        data: data,
        current_page: page,
        total_pages: Math.ceil(data_count / limit),
      };
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  };

  async discount(dto: AddDiscountDto, req: any) {
    let { discount, start_time, end_time } = dto;

    let vendor = await this.model.vendor.findById(req.payload.user_id);
    let restaurant = await this.model.restaurant.findById(vendor.restaurant_id);
    if (!restaurant) {
      throw new Error('restaurant not found ');
    }

    if (discount > 0) {
      await this.model.restaurant.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            restaurant_discount: {
              discount: discount,
              start_time: start_time,
              end_time: end_time,
            },
            restaurant_discount_update: false,
          },
        },
      );
    } else {
      await this.model.restaurant.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            restaurant_discount: null,
            restaurant_discount_update: false,
          },
        },
      );

      await this.model.food.updateMany(
        { restaurant_id: restaurant._id },
        {
          $set: {
            discounted_price: null,
          },
        },
      );
    }
    return { status: true, message: 'discount updated successfully ' };
  }

  async mostDiscountedRestaurant(dto: featuresListDto, showRange: number) {
    let { lat, long } = dto;

    const pipeline: any[] = [];
    if (lat && long) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          distanceField: 'distance',
          maxDistance: showRange,
          spherical: true,
        },
      });
    }

    pipeline.push({
      $match: {
        is_restaurant_verified: true,
        is_deleted: false,
        is_block: false,
        restaurant_type: RestaurantType.Restaurant,
        status: restaurantStatus.Online,
        restaurant_discount: {
          $ne: null,
        },
      },
    });

    pipeline.push({
      $sort: {
        'restaurant_discount.discount': -1,
      },
    });
    pipeline.push({
      $limit: 15,
    });

    return await this.model.restaurant.aggregate(pipeline);
  }

  async popularRestaurant(dto: featuresListDto, showRange: number) {
    let { lat, long } = dto;

    const pipeline: any[] = [];

    if (lat && long) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          distanceField: 'distance',
          maxDistance: showRange,
          spherical: true,
        },
      });
    }

    pipeline.push({
      $match: {
        is_restaurant_verified: true,
        is_deleted: false,
        is_block: false,
        restaurant_type: RestaurantType.Restaurant,
        status: restaurantStatus.Online,
        total_orders: { $gt: 3 },
      },
    });

    pipeline.push({
      $sort: {
        total_orders: -1,
      },
    });

    pipeline.push({
      $limit: 15,
    });

    return await this.model.restaurant.aggregate(pipeline);
  }

  async newRestaurant(dto: featuresListDto, showRange: number) {
    let { lat, long } = dto;

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const pipeline: any[] = [];

    if (lat && long) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          distanceField: 'distance',
          maxDistance: showRange,
          spherical: true,
        },
      });
    }

    pipeline.push({
      $match: {
        is_restaurant_verified: true,
        is_deleted: false,
        is_block: false,
        restaurant_type: RestaurantType.Restaurant,
        status: restaurantStatus.Online,
        createdAt: { $gte: twoMonthsAgo },
      },
    });

    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });

    pipeline.push({
      $limit: 15,
    });

    return await this.model.restaurant.aggregate(pipeline);
  }

  async customerLikeRestaurant(
    dto: featuresListDto,
    customer,
    showRange: number,
  ) {
    let customer_like_restaurant = [];
    if (customer) {
      let restaurant_ids = await this.model.order.distinct('restaurant_id', {
        customer_id: customer._id,
      });
      customer_like_restaurant = await this.model.restaurant.find({
        status: restaurantStatus.Online,
        is_restaurant_verified: true,
        _id: { $in: restaurant_ids },
      });
    }
    return customer_like_restaurant;
  }

  async nearByRestaurant(dto: featuresListDto, showRange: number) {
    let { lat, long } = dto;

    const pipeline: any[] = [];

    if (lat && long) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          distanceField: 'distance',
          maxDistance: showRange,
          spherical: true,
        },
      });
    }

    pipeline.push({
      $match: {
        is_restaurant_verified: true,
        is_deleted: false,
        is_block: false,
        restaurant_type: RestaurantType.Restaurant,
        status: restaurantStatus.Online,
      },
    });

    pipeline.push({
      $limit: 15,
    });

    return await this.model.restaurant.aggregate(pipeline);
  }

  async featuresList(dto: featuresListDto, req: any = null) {
    let customer_id = req?.payload?.user_id ?? null;
    let customer = await this.model.customer.findById(customer_id);

    const appConfiguration = await this.model.appConfiguration.findOne();
    let showRange = 10000;
    if (appConfiguration && appConfiguration.show_restaurant_range) {
      showRange = appConfiguration.show_restaurant_range;
    }

    if (dto.response_type === 'most_discounted_restaurant') {
      return { data: await this.mostDiscountedRestaurant(dto, showRange) };
    } else if (dto.response_type === 'popular_restaurant') {
      return { data: await this.popularRestaurant(dto, showRange) };
    } else if (dto.response_type === 'new_restaurant') {
      return { data: await this.newRestaurant(dto, showRange) };
    } else if (dto.response_type === 'customer_like_restaurant') {
      return {
        data: await this.customerLikeRestaurant(dto, customer, showRange),
      };
    } else if (dto.response_type === 'near_by_restaurant') {
      return { data: await this.nearByRestaurant(dto, showRange) };
    } else {
      return {
        most_discounted_restaurant: await this.mostDiscountedRestaurant(
          dto,
          showRange,
        ),
        popular_restaurant: await this.popularRestaurant(dto, showRange),
        new_restaurant: await this.newRestaurant(dto, showRange),
        customer_like_restaurant: await this.customerLikeRestaurant(
          dto,
          customer,
          showRange,
        ),
        near_by_restaurant: await this.nearByRestaurant(dto, showRange),
      };
    }
  }

  async popularFoodItem(id: string) {
    let restaurant = await this.model.restaurant.findById(id);
    if (!restaurant) {
      throw new HttpException(
        {
          error_code: 'restaurant not found',
          error_description: 'restaurant not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    let filter: any = {
      is_deleted: false,
      order_count: { $gt: 3 },
    };

    if (restaurant.is_custom_menu) {
      filter.restaurant_id = restaurant._id;
    } else {
      filter.restaurant_id = null;
    }

    let foodItems = await this.model.food
      .find(filter)
      .sort({ order_count: -1 })
      .limit(15);

    return { food_items: foodItems };
  }

  async amenities() {
    let data = await this.model.AmenitiesModel.find().sort({ createdAt: -1 });
    return { data: data };
  }

  // async homeCookedServices() {
  //   let data = await this.model.HomeCookedServicesModel.find().sort({createdAt : -1})
  //   return {data : data}
  // }

  // async dineOutRestaurants(dto : dineOutListDto){

  //   let {page, limit, food_type, rating, service_id, search, sort_by} = dto;
  //   let skip = (page -1) * limit;

  //   let filter : any = {
  //     isDineOut : true,
  //     is_active: true,
  //     is_block: false,
  //     is_restaurant_verified: true,
  //     is_deleted: false
  //   };

  //   if(search !== undefined && search !== ""){
  //       filter.restaurant_name = { $regex: search, $options: 'i' }
  //   }

  //   if(food_type !== undefined && food_type !== ""){
  //     filter.food_type = { $in : [food_type]}
  //   }

  //   if(rating !== undefined && rating){
  //     filter.rating = { $gte : rating}
  //   }

  //   let sortObj : any  = {
  //     createdAt : -1
  //   }

  //   if(sort_by !== undefined && sort_by == DineOutSortBy.Rating){
  //     sortObj = {
  //       rating : -1
  //     }

  //   }

  //   if(service_id !== undefined && service_id !== ""){
  //     filter.services = { $in : [new mongoose.Types.ObjectId(service_id)]}
  //   }

  //   let total = await this.model.restaurant.countDocuments(filter);
  //   let dineOuts = await this.model.restaurant.find(filter)
  //   .limit(limit)
  //   .skip(skip)
  //   .sort(sortObj)

  //   return {total : total , data : dineOuts}
  // }

  async addServices(dto: CreateRestaurantServiceDto) {
    let data = await this.model.ServicesModel.create(dto);
    return { data: data };
  }

  async updateServices(dto: UpdateRestaurantServiceDto, id: string) {
    await this.model.ServicesModel.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: dto,
      },
    );
    let data = await this.model.ServicesModel.findById(id);
    return { data: data };
  }

  async deleteServices(id: string) {
    await this.model.ServicesModel.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });
    return { data: 'delete successfully' };
  }

  async services(dto: GetRestaurantServiceDto) {
    let { search, page, limit } = dto;
    let skip = (page - 1) * limit;

    let filter: any = {};
    if (search !== undefined && search !== '') {
      filter.name = { $regex: search, $options: 'i' };
    }

    let total = await this.model.ServicesModel.countDocuments(filter);
    let data = await this.model.ServicesModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    return { total: total, data: data };
  }

  async serviceDetails(id: string) {
    let data = await this.model.ServicesModel.findById(id);
    return { data: data };
  }

  async EarningAndOrders(req: any, filter?: Slots) {
    try {
      const restaurant_id = new mongoose.Types.ObjectId(req.user.restaurant_id);
      const now = new Date();

      let body: any = {};

      if (filter.start_time && filter.end_time) {
        body.created_at = {
          $gte: Number(filter.start_time),
          $lte: Number(filter.end_time),
        };
      }

      const startOfThisMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();

      const endOfThisMonth = now.getTime();

      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      ).getTime();

      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      ).getTime();

      const calculateGrowth = (current: number, previous: number) => {
        if (!previous) {
          if (!current) return { percent: 0, type: 'neutral' };
          return { percent: 100, type: 'increase' };
        }

        const percent = ((current - previous) / previous) * 100;

        return {
          percent: Number(percent.toFixed(2)),
          type: percent > 0 ? 'increase' : percent < 0 ? 'decrease' : 'neutral',
        };
      };

      const [lifetime] = await this.model.earnings.aggregate([
        {
          $match: { restaurant_id, ...body },
        },

        {
          $group: {
            _id: null,

            total_earning: { $sum: '$restaurant_earning' },

            food_earning: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$earning_type',
                      [EarningType.Current, EarningType.Schedule],
                    ],
                  },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            pos_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Pos] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            grocery_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Grocery] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            pharmacy_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Pharmacy] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            electronics_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Electronics] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            cloth_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Cloth] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            catering_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Catering] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            deal_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.Deal] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },
            slot_earning: {
              $sum: {
                $cond: [
                  { $eq: ['$earning_type', EarningType.SlotBooking] },
                  '$restaurant_earning',
                  0,
                ],
              },
            },

            deal_orders: {
              $sum: {
                $cond: [{ $ne: ['$deal_order_id', null] }, 1, 0],
              },
            },

            slot_orders: {
              $sum: {
                $cond: [{ $ne: ['$slot_id', null] }, 1, 0],
              },
            },

            normal_orders: {
              $sum: {
                $cond: [{ $ne: ['$order_id', null] }, 1, 0],
              },
            },

            other_orders: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$slot_id', null] },
                      { $eq: ['$order_id', null] },
                      { $eq: ['$deal_order_id', null] },
                      { $eq: ['$booking_id', null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const [currentMonth] = await this.model.earnings.aggregate([
        {
          $match: {
            restaurant_id,
            created_at: { $gte: startOfThisMonth, $lte: endOfThisMonth },
          },
        },
        {
          $group: {
            _id: null,
            earning: { $sum: '$restaurant_earning' },
          },
        },
      ]);

      const [previousMonth] = await this.model.earnings.aggregate([
        {
          $match: {
            restaurant_id,
            created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: null,
            earning: { $sum: '$restaurant_earning' },
          },
        },
      ]);

      return {
        total_earning: Number((lifetime?.total_earning || 0).toFixed(2)),

        food_earning: Number((lifetime?.food_earning || 0).toFixed(2)),
        pos_earning: Number((lifetime?.pos_earning || 0).toFixed(2)),
        grocery_earning: Number((lifetime?.grocery_earning || 0).toFixed(2)),
        pharmacy_earning: Number((lifetime?.pharmacy_earning || 0).toFixed(2)),
        electronics_earning: Number(
          (lifetime?.electronics_earning || 0).toFixed(2),
        ),
        cloth_earning: Number((lifetime?.cloth_earning || 0).toFixed(2)),
        catering_earning: Number((lifetime?.catering_earning || 0).toFixed(2)),
        deal_earning: Number((lifetime?.deal_earning || 0).toFixed(2)),
        dine_out_earning: Number((lifetime?.slot_earning || 0).toFixed(2)),

        order: {
          normal_orders: lifetime?.normal_orders || 0,
          deal_orders: lifetime?.deal_orders || 0,
          slot_orders: lifetime?.slot_orders || 0,
          other_orders: lifetime?.other_orders || 0,

          total_orders:
            (lifetime?.normal_orders || 0) +
            (lifetime?.deal_orders || 0) +
            (lifetime?.slot_orders || 0) +
            (lifetime?.other_orders || 0),
        },

        earning_growth: calculateGrowth(
          currentMonth?.earning || 0,
          previousMonth?.earning || 0,
        ),

        filtered: false,

        date_range: {
          start: startOfThisMonth,
          end: endOfThisMonth,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async EarningAndOrdersGraph(req: any, filter: Slots) {
    try {
      const restaurant_id = req.user.restaurant_id;

      let start_time = Number(filter.start_time);
      let end_time = Number(filter.end_time);

      if (filter.start_time && filter.end_time) {
        start_time = moment.utc(start_time).startOf('day').valueOf();
        end_time = moment.utc(end_time).endOf('day').valueOf();
      }

      if (!Number.isFinite(start_time) || !Number.isFinite(end_time)) {
        throw new Error('Start time and end time must be UTC milliseconds');
      }

      const agg = new RestaurantAggregation();

      const data = await this.model.earnings.aggregate([
        agg.graphBaseMatch(restaurant_id, start_time, end_time),
        agg.graphGroupByDay(),
        agg.graphProjectLabel(),
        agg.graphSort(),
        agg.graphFinalProject(),
      ]);

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  async findModules(id: string) {
    try {
      let result = await this.model.restaurant.findById(id);
      let response = {
        restaurant_id: result._id,
        isDineOut: result.isDineOut,
        isFoodDelivery: result.isFoodDelivery,
        dealProvider: result.dealProvider,
        isSubscriptionProvide: result.isSubscriptionProvide,
        catering_services: result.catering_services,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async qrCode(req: any, dto: QRCodeDto) {
    try {
      let { type } = dto;

      let restaurant = await this.model.restaurant.findOne({
        vendor_id: req.user._id,
      });
      if (!restaurant) throw new Error('Restaurant not found');

      const tenantId = req?.tenantId ?? '';

      let FRONTEND_URL = process.env.FRONTEND_URL || '';
      if (process.env.ENVIROMENT == 'local') {
        FRONTEND_URL = FRONTEND_URL.replace('**TENANTID**', tenantId)
          .replace(/"/g, '')
          .replace(/;$/, '')
          .replace(/\/$/, '');
      } else if (process.env.ENVIROMENT == 'dev') {
        FRONTEND_URL = FRONTEND_URL.replace('**TENANTID**', tenantId)
          .replace(/"/g, '')
          .replace(/;$/, '')
          .replace(/\/$/, '');
      } else if (process.env.ENVIROMENT == 'live') {
        FRONTEND_URL = FRONTEND_URL.replace('**TENANTID**', tenantId)
          .replace(/"/g, '')
          .replace(/;$/, '')
          .replace(/\/$/, '');
      }

      let qrCodeUrl = null;

      let qrCode = null;

      let qrCodeImage: any = null;
      let payload: any = {};
      if (type == 'table') {
        qrCodeUrl = `${FRONTEND_URL}/qr-table-order/${restaurant._id.toString()}`;
        qrCode = await this.commonService.generateQRCode(qrCodeUrl);
        qrCodeImage = await this.appService.uploadQRcode(qrCode);
        payload.qr_code_for_table = qrCodeImage.name;
      } else {
        qrCodeUrl = `${FRONTEND_URL}/qr-menu/${restaurant._id.toString()}?type=${restaurant.restaurant_type}`;
        qrCode = await this.commonService.generateQRCode(qrCodeUrl);
        qrCodeImage = await this.appService.uploadQRcode(qrCode);
        payload.qr_code_image = qrCodeImage.name;
      }

      await this.model.restaurant.updateOne(
        { _id: restaurant._id },
        {
          $set: payload,
        },
      );

      return {
        success: true,
        message: 'QR code generated and updated successfully',
        url: qrCodeImage.Location,
        key: qrCodeImage.key,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDriversListForVendor(req: any, body: any) {
    try {
      const { page, limit, search } = body;
      const options = await this.commonService.set_options(
        page || 1,
        limit || 10,
      );

      let restaurant = await this.model.restaurant.findOne({
        vendor_id: req.user._id,
      });
      if (!restaurant) throw new Error('Restaurant not found');

      let searchQuery = {};
      if (search) {
        searchQuery = {
          $or: [{ name: { $regex: search, $options: 'i' } }],
        };
      }

      let pipeline: any = [
        await this.restaurantAggregation.driverMatchForVendor(searchQuery),
      ];

      pipeline.push(
        await this.restaurantAggregation.driverLookupForRestaurant(restaurant),
      );
      pipeline.push(
        await this.restaurantAggregation.unwindDriverForRestaurant(),
      );

      if (body.for == 'store') {
        pipeline.push({
          $match: {
            restaurantdrivers: { $ne: null },
          },
        });
      } else {
        pipeline.push({
          $match: {
            restaurantdrivers: null,
          },
        });
      }

      pipeline.push(
        await this.restaurantAggregation.driverPaginationForVendor(options),
      );

      const data = await this.model.driver.aggregate(pipeline);

      return {
        count: data[0]?.count[0]?.count || 0,
        data: data[0]?.data || [],
      };
    } catch (error) {
      console.error('Error in getDriversListForVendor:', error);
      throw error;
    }
  }

  async selectDriversForRestaurant(req: any, dto: SelectDriversDto) {
    try {
      const { driver_ids } = dto;
      const uniqueDriverIds = [...new Set(driver_ids)];

      // Check if restaurant exists
      const restaurant = await this.model.restaurant.findOne({
        vendor_id: new mongoose.Types.ObjectId(req.user._id),
        is_deleted: false,
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // Validate that all driver IDs are valid MongoDB ObjectIds
      for (const driverId of uniqueDriverIds) {
        if (!mongoose.Types.ObjectId.isValid(driverId)) {
          throw new BadRequestException(`Invalid driver ID: ${driverId}`);
        }
      }

      // Remove existing drivers for this restaurant
      // await this.model.RestaurantDrivers.deleteMany({
      //   restaurant_id: new mongoose.Types.ObjectId(restaurant._id),
      // });

      if (dto.type == 'unselect') {
        await this.model.RestaurantDrivers.deleteMany({
          restaurant_id: new mongoose.Types.ObjectId(restaurant._id),
          driver_id: {
            $in: uniqueDriverIds.map(
              (driverId) => new mongoose.Types.ObjectId(driverId),
            ),
          },
        });
      } else {
        // Create new entries for each driver
        const restaurantDriversData = uniqueDriverIds.map((driverId) => ({
          restaurant_id: new mongoose.Types.ObjectId(restaurant._id),
          driver_id: new mongoose.Types.ObjectId(driverId),
        }));
        const createdEntries = await this.model.RestaurantDrivers.insertMany(
          restaurantDriversData,
        );
      }
      return {
        message: 'Store Drivers updated successfully',
      };
    } catch (error) {
      console.error('Error in selectDriversForRestaurant:', error);
      throw error;
    }
  }
}
