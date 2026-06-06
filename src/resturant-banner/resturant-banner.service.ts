import { Injectable } from '@nestjs/common';
import { CreateResturantBannerDto } from './dto/create-resturant-banner.dto';
import { UpdateResturantBannerDto } from './dto/update-resturant-banner.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import mongoose, { Types } from 'mongoose';
import { BannerListDto, GetNearbyBannersDto } from './dto/get-nearby-banners.dto';
import * as moment from 'moment';
import { UsersType } from 'src/auth/role/user.role';
import { BannerType } from './entities/resturant-banner.entity';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';

@Injectable()
export class ResturantBannerService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
  ) { }

  async createBanner(req: any, dto: CreateResturantBannerDto) {


    let body: any = dto;

    if (req.payload.scope == UsersType.Admin || req.payload.scope == UsersType.SubAdmin) {
      body.type = BannerType.Admin;
    } else if (req.payload.scope == UsersType.Vendor) {

      let restaurant = await this.model.restaurant.findOne({
        vendor_id: req.payload.user_id,
      });


      if(restaurant && restaurant.restaurant_type == RestaurantType.Grocery){
        body.type = BannerType.Grocery;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Pharmacy){
        body.type = BannerType.Pharmacy;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Electronics){
        body.type = BannerType.Electronics;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Cloth){
        body.type = BannerType.Cloth;
      }else {
          body.type = BannerType.Restaurant;
      }

    }

    console.log("===>>eeeeeeee" , body)
    if (body.restaurant_id !== undefined && body.restaurant_id !== "") {
      body.restaurant_id = new Types.ObjectId(body.restaurant_id);

      await this.model.RestaurantBannerModel.updateMany(
        { restaurant_id: new Types.ObjectId(body.restaurant_id), is_active: true },
        { $set: { is_active: false } }
      );
    }

    let banner = this.model.RestaurantBannerModel.create(body);

    return banner;

  }

  async getBannersForUserApp(user, dto: GetNearbyBannersDto) {

    let {type } = dto;   
    if(type == undefined || type == null){
      type = BannerType.Restaurant;
    } 

    if(dto.lat == undefined || dto.long == undefined || dto.lat == "" || dto.long == "")
    {
      throw new Error("Latitude and Longitude are required");
    }

    const appConfiguration = await this.model.appConfiguration.findOne();
    let showRange = 10000;
    if(appConfiguration && appConfiguration.show_restaurant_range){
      showRange = appConfiguration.show_restaurant_range;
    }

    const lat = parseFloat(dto.lat);
    const long = parseFloat(dto.long);

    let today = new Date(moment.utc().startOf('day').toISOString());
    let end = new Date(moment.utc().endOf('day').toISOString());

    return this.model.restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [long, lat],
          },
          distanceField: 'distance',
          maxDistance: showRange,
          spherical: true,
          query: {
            is_active: true,
            is_deleted: false,
          },
        },
      },
      {
        $lookup: {
          from: 'restaurantbanners',
          let: { restaurantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$restaurant_id', '$$restaurantId']
                }, 
                type: type
              }, 
            }
          ],
          as: 'banners'
        }
      },


      { $unwind: '$banners' },
      
      
      {
        $match: {
          'banners.is_active': true,
          $expr: {
            $and: [

              { $lte: ['$banners.start_date', end] },
              {
                $or: [
                  { $gte: ['$banners.end_date', today] },
                  { $eq: ['$banners.end_date', null] },
                ]
              },

            ],
          },
        },
      },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: '$banners._id',
          title: '$banners.title',
          description: '$banners.description',
          banner_url: '$banners.banner_url',
          type: '$banners.type',
          restaurant_id: '$_id',
          restaurant_name: '$name',
          distance: 1,
        },
      },
    ]);
  }

  async getAllBannersForAdmin(restaurantId?: string) {
    const query: any = {};
    if (restaurantId) {
      query.restaurant_id = new Types.ObjectId(restaurantId);
      query.is_active = true;
    }

    return this.model.RestaurantBannerModel.find(query).populate(
      'restaurant_id',
    );
  }


  async updateBanner(id: string, updateData: Partial<CreateResturantBannerDto>) {
    let body :any = updateData;

    if(updateData.restaurant_id !== undefined && updateData.restaurant_id){
      body.restaurant_id = new mongoose.Types.ObjectId(updateData.restaurant_id);

      let restaurant = await this.model.restaurant.findOne({
        _id: new mongoose.Types.ObjectId(updateData.restaurant_id),
      });

      console.log("restaurant ", restaurant);

      if(restaurant && restaurant.restaurant_type == RestaurantType.Grocery){
        body.type = BannerType.Grocery;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Pharmacy){
        body.type = BannerType.Pharmacy;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Electronics){
        body.type = BannerType.Electronics;
      } else if(restaurant && restaurant.restaurant_type == RestaurantType.Cloth){
        body.type = BannerType.Cloth;
      }else {
          body.type = BannerType.Restaurant;
      }


    }
    return this.model.RestaurantBannerModel.findByIdAndUpdate(id, body, { new: true });

  }

  async deleteBanner(id: string) {
    return this.model.RestaurantBannerModel.findByIdAndDelete(id);
  }

  async deactivateExpiredBanners() {
    const now = new Date();
    await this.model.RestaurantBannerModel.updateMany(
      {
        is_active: true,
        end_date: { $lt: now },
      },
      { $set: { is_active: false } },
    );
  }

  async toggleBannerStatus(id: string, status: 'active' | 'inactive') {
    const isActive = status === 'active';
    return this.model.RestaurantBannerModel.findByIdAndUpdate(
      id,
      { is_active: isActive },
      { new: true }
    );
  }


  async resturantBanners(id : string, req : any) {

    let banners = await this.model.RestaurantBannerModel.find({ restaurant_id : new Types.ObjectId(id) });

    return {banners : banners};

  }


  async getBannerDetails(id){
    let banner = await this.model.RestaurantBannerModel.findById(id);

    return {banner : banner};
  }




  async resturantBanneres(dto: BannerListDto, req: any) {


    let start = new Date(moment.utc().startOf('day').toISOString());
    let end = new Date(moment.utc().endOf('day').toISOString());


    console.log("start ", start);
    console.log("end ", end);

    let banners = [];
    let { page, limit } = dto;
    let skip = (page - 1) * limit;

    page = (page !== undefined && page !== null) ? page : 1;
    limit = (limit !== undefined && limit !== null) ? limit : 50;

    let filter: any = {};
    filter.start_date = {
      $lte: start
    }

    filter.end_date = {
      $gte: end
    }

    let scope = req?.payload?.scope ?? null;
    if (scope === UsersType.Admin) {
      filter.type = BannerType.Admin;
    } else if (scope === UsersType.Vendor) {
      let restaurant = await this.model.restaurant.findOne( {vendor_id : req.user._id});
      filter.restaurant_id = restaurant._id;
      filter.is_active = true;
    } else if (scope === UsersType.Customer) {
      filter.is_active = true;
      filter.type = BannerType.Admin;
    } else {
      filter.is_active = true;
      filter.type = BannerType.Admin;
    }

    console.log("filter ", filter);

    let total = await this.model.RestaurantBannerModel.countDocuments(filter);
    banners = await this.model.RestaurantBannerModel.find(filter)
      .sort({ createdAt: -1 }).limit(limit).skip(skip);

    return { total: total, banners: banners };

  }
}
