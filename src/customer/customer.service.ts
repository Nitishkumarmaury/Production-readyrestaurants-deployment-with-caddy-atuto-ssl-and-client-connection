import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ifError } from 'assert';
import { CommonService } from 'src/common/common.service';

import { DbService } from 'src/db/db.service';
import * as path from 'path';

import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { CustomerAggregation } from './customer.aggregation';
import mongoose, { Types } from 'mongoose';
import * as moment from 'moment';
import { CustomerOrderDto, CustomerWalletHistoryDto, DetailedSearchDto, GetAllRestaurantDto, groceryRestaurentDto, QuickPicksDto, YourOrdersDto } from './dto/customer.dto';
import { restaurantStatus } from 'src/restaurant/schema/restaurant.schema';
import { ResponseMapper } from '../common/utils/response-mapper.util'; // Import
import { ConsoleMessage } from 'puppeteer';
import { WalletTxnCreditType, WalletTxnType } from 'src/wallet/entities/wallet-transaction.entity';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { PaymentStatus } from 'src/order/schema/order.schema';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerAggregation: CustomerAggregation,
    private readonly model: DbService,
    private readonly commonService: CommonService,

  ) { }
  async find_customer_with_id(id: string) {
    try {
      const customer = await this.model.customer.findOne({ _id: id });
      return customer;
    } catch (error) {
      throw error;
    }
  }


  async GetAllRestaurant(body : GetAllRestaurantDto, page, limit, user_id?: string) {
    try {

      console.log("user_id ==>> ", user_id)


      await this.model.restaurant.updateMany({catering_services : {$ne : true}}, {
        $set : {
          catering_services : false,
        }
      });

      const skip = (page - 1) * limit;
      let query: any = {
          status: restaurantStatus.Online
      };
      let sort = {};
      if (body.rating_4plus === true) {
        query = { rating: { $gt: 4 } };
      }
      if (body.veg === true) {
        query = { food_type: { $in: ['veg'] } };
      } else if (body.non_veg === true) {
        query = { food_type: { $in: ['non_veg', 'egg'] } };
      }
      else if (body.egg === true) {
        query = { food_type: { $in: ['egg'] } };
      }else if (body.jain === true){
        query = { food_type: { $in: ['jain'] } };
      }


      if(body.isDineOut === true){
        query.isDineOut = true;
      }

      if(body.isSubscriptionProvide == true){
        query.isSubscriptionProvide = true;
      }

      if(body.isFoodDelivery === true){
        query.isFoodDelivery = true;
        
      }

      if(body.dealProvider === true){
        query.dealProvider = true;
        
      }
      
      

      if(body.catering_services === true){
        query.catering_services = true;
      }

      query.is_block = false;
      query.is_deleted = false;

      query.is_active = true;
      query.is_restaurant_verified = true;
      query.restaurant_type= RestaurantType.Restaurant; // change made to show only restaurent type restaurent not grocery restuarent...


      const appConfiguration = await this.model.appConfiguration.findOne();
      let showRange = 10000;
      if(appConfiguration && appConfiguration.show_restaurant_range){
        showRange = appConfiguration.show_restaurant_range;
      }


      console.log("=== q", query)

      let pipeline = [];
      if (body.long && body.lat) {        
        pipeline.push(
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(body.long), parseFloat(body.lat)],
              },
              distanceField: "distance",
              maxDistance: showRange,
              spherical: true,
            },
          },
          
          {
            $sort: {
              distance: -1
            }
          })
      }


      pipeline.push({
            $match: {
              ...query
            }
          })



      pipeline.push({  
        $lookup: {
          from: 'amenities',     
          localField: 'amenities', 
          foreignField: '_id',  
          as: 'amenities' 
        }
      })

      pipeline.push({  
        $lookup: {
          from: 'services',     
          localField: 'services', 
          foreignField: '_id',  
          as: 'services' 
        }
      })

      pipeline.push({
        $lookup: {
          from: 'favourites',
          let: { restaurant_id: '$_id' , customer_id : new mongoose.Types.ObjectId(user_id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$restaurant_id', '$$restaurant_id'] },
                    { $eq: ['$customer_id', '$$customer_id'] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } } // Only project _id to keep the document small
          ],
            as: 'favourites',
          }
        },
        {
          $addFields: {
            // Check if the 'favourites_match' array has more than 0 elements
            is_fav: { $gt: [{ $size: '$favourites' }, 0] }
          }
        }
      )

      pipeline.push({
        $lookup: {
          from: 'reviews',
          let: { restaurant_id: '$_id'},
          pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$restaurant_id', '$$restaurant_id']
                  }
                }
              },
              { $project: { _id: 1 } } // Only project _id to keep the document small
            ],
            as: 'reviews',
          }
      },
      {
        $addFields: {
          rating_count: { $size: '$reviews' }
        }
      },
    )

      pipeline.push(
        {
            $facet: {
                count: [
                    {
                        $count: "count"
                    },
                ],
                data: [
                    {
                        $sort: {
                            _id: -1 as 1 | -1
                        }
                    },

                    {
                      $project: {
                      _id: 1,
                      restaurant_name : 1,
                      restaurant_phone :1,
                      services: 1,
                      amenities :1, 
                      average_preparing_time :1,
                      address:1,
                      location:1,
                      country_code:1,
                      image:1,
                      food_licence_image:1,
                      status:1,
                      working_day:1,
                      dine_out_working_day:1,
                      food_type:1,
                      is_active:1,
                      rating:1,
                      is_restaurant_verified:1,
                      is_submit_verification:1,
                      total_orders:1,
                      quick_pick_time:1,
                      report_reason_id:1,
                      restaurant_discount:1,
                      restaurant_discount_update:1,
                      restaurant_type:1,
                      isFoodDelivery:1,
                      isDineOut: 1,
                      estimated_price_per_plate: 1,
                      booking_amount: 1,
                      uploadRestaurantMenu : 1,
                      uploadRestaurantPhotos: 1,
                      maximum_capacity_slot: 1,
                      buffer_time: 1,
                      total_availability: 1,
                      subscribers_limit: 1,
                      is_fav : 1,
                      rating_count : 1,
                      is_delivery_available :1,
                      delivery_price_per_km:1,
                      delivery_range_in_km:1,
                      catering_services : 1,
                      dealProvider: 1,
                      isSubscriptionProvide : 1,
                      

                     }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: parseInt(limit)
                    },
                ]
            }
        }
      )



      const result = await this.model.restaurant.aggregate(pipeline);


      let data = [];
      for (const restaurant of result[0].data) {
        
        const distance = await this.commonService.calculateDistanceUsingFormula(body.lat || 0,
          body.long || 0,
          restaurant.address?.lat || 0,
          restaurant.address?.long || 0,
        );

        // const distance = await this.commonService.CalculateDistance(
        //   body.lat || 0,
        //   body.long || 0,
        //   restaurant.address?.lat || 0,
        //   restaurant.address?.long || 0,
        // );

        let check_category = await this.model.food
        .find({ restaurant_id: restaurant._id }, { category_id: 1 })
        .populate([{ path: 'category_id' }]);

        let uniqueCategories = Array.from(
          new Set(check_category.map((food) => food.category_id)),
        );
      
        let category = await this.model.category.find({
          _id: { $in: uniqueCategories },
        });

        const check_coupon = await this.model.coupon.findOne({
          restaurant_id: restaurant._id,
          status: 'active', // Assuming there's a 'status' field to check if the coupon is active
          type: "in-app"
        });


        data.push({
          ...restaurant,
          distance : {distance : distance.toFixed(2)},
          category,
          active_offer: !!check_coupon, // true if coupon exists, false otherwise
          coupon_details: check_coupon || null, // Include coupon details if available
        });

      }

      if (body.sort_by == 'distance') {
        // data.sort((a, b) => a.distance - b.distance);
        data.sort((a, b) => a.distance.distance - b.distance.distance);      
      }
      
      if (body.sort_by === 'rating') {
        data.sort((a, b) => b.rating - a.rating);
      }

      return { data_count: result[0]?.count[0]?.count ?? 0, data:  data};

    } catch (error) {
      throw error;
    }
  }




  async QuickPicks(body: QuickPicksDto, user_id?) {
    try {
      const skip = (body.page - 1) * body.limit;
      // Fetch all restaurants with pagination

      const data = await this.model.restaurant
        .find({ status: "online" })
        .sort({ total_orders: -1 }); // Sort by number of orders in descending order (popularity)

      let quickPicks = [];
      let is_fav;
      // Iterate through the restaurants to check for active offers
      for (const restaurant of data) {
        let check_category = await this.model.food
          .find({ restaurant_id: restaurant._id }, { category_id: 1 })
          .populate([{ path: 'category_id' }]);
        if (body.lat && body.long) {
          const radius = await this.commonService.calculate_radius_distance(
            body.lat,
            body.long,
            restaurant.address?.lat || 0,
            restaurant.address?.long || 0,
          );
          if (radius <= 1200000000) {
            check_category = await this.model.food
              .find({ restaurant_id: restaurant._id }, { category_id: 1 })
              .populate([{ path: 'category_id' }]);
          }
        }

        let uniqueCategories = Array.from(
          new Set(check_category.map((food) => food.category_id)),
        );
        let category = await this.model.category.find({
          _id: { $in: uniqueCategories },
        });
        const check_fav = await this.model.favourite.findOne({
          customer_id: user_id,
          restaurant_id: restaurant._id,
        });
        is_fav = check_fav ? true : false;
        const check_coupon = await this.model.coupon.findOne({
          restaurant_id: restaurant._id,
          status: 'active', // Assuming there's an 'is_active' field to check if the coupon is active
          type: "in-app"
        });

        // If there's an active coupon, add to quick picks
        if (check_coupon) {
          quickPicks.push({
            ...restaurant.toObject(),
            is_fav,
            category,
            active_offer: true,
            coupon_details: check_coupon,
          });
        } else {
          quickPicks.push({
            ...restaurant.toObject(),
            category,
            is_fav,
            active_offer: false,
          });
        }

      }
      // return { quickPicks: quickPicks };
      console.log("quickPicks", quickPicks);

      // Filter restaurants to apply pagination AFTER distance filtering
      const paginatedQuickPicks = quickPicks.slice(skip, skip + body.limit);

      // Return paginated results and correct pagination info
      return {
        data_count: quickPicks.length,
        data: quickPicks
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  get_quick_picks_customer = async (body: QuickPicksDto, user_id?: string) => {
    try {
      const { page, limit, lat, long } = body;
      const options = await this.commonService.set_options(page, limit);

      const app_config = await this.model.appConfiguration.findOne();

      const pipeline: any[] = [];

      if (lat && long) {
        pipeline.push({
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(long), parseFloat(lat)],
            },
            distanceField: "distance",
            maxDistance: 120000 * 1000, // app_config.show_restaurant_range ? Number(app_config.show_restaurant_range) : 12000,
            spherical: true,
          },
        });
      }

      pipeline.push({
        $match: {
          is_quick_pick: true,
          is_block: false,
          is_deleted: false,
          // verification: RestaurantVerificationStatus.APPROVED,
          // doc_update_verification: { $in: [RestaurantVerificationStatus.NULL, RestaurantVerificationStatus.APPROVED] },
        },
      });

      pipeline.push(
        {
          $lookup: {
            from: "favourites",
            let: { restro_id: "$_id", user_id: user_id ? new Types.ObjectId(user_id) : null },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$$restro_id", "$restaurant_id"] },
                      { $eq: ["$$user_id", "$customer_id"] },
                    ],
                  },
                },
              },
            ],
            as: "favourites",
          },
        },
        {
          $addFields: {
            is_fav: {
              $cond: {
                if: { $gt: [{ $size: "$favourites" }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            favourites: 0
          }
        }
      );

      pipeline.push(await this.customerAggregation.face_set(options))

      const restaurants = await this.model.restaurant.aggregate(pipeline);
      return {
        data: restaurants[0]?.data || [],
        count: restaurants[0]?.count[0]?.count || 0,
      };
    } catch (error) {
      throw error;
    }
  };


 
 


  async RelaventSearch(body) {
    try {

      let restaurant_with_food = [];

      // // keep category with regex for now (since no FTS index for category yet)//FTS limit reached for our Atlas free  tier
      let category = await this.model.category.findOne({
        category_name: { $regex: `^${body?.search}`, $options: 'i' },
      });


      let food_with_category;
      if (category) {
        food_with_category = await this.model.food.find({
          is_deleted: false ,
          category_id: category._id,
        });

        if (food_with_category.length > 0) {
          const restaurantSet = new Set();

          for (const food of food_with_category) {
            const restaurantId = food.restaurant_id.toString();

            if (!restaurantSet.has(restaurantId)) {
              const restaurant = await this.model.restaurant.findOne({ _id: restaurantId });

              if (restaurant) {
                let withinRadius = true;

                if (body.lat && body.long) {
                  const radius = await this.commonService.calculate_radius_distance(
                    body.lat,
                    body.long,
                    restaurant.address?.lat || 0,
                    restaurant.address?.long || 0
                  );
                  withinRadius = radius <= 12;
                }

                if (withinRadius) {
                  restaurant_with_food.push(restaurant.toObject());
                  restaurantSet.add(restaurantId);
                }
              }
            }

            if (restaurant_with_food.length >= 6) {
              break;
            }
          }
        }
      }

      // Used Atlas Search for restaurants
      let restaurant = await this.model.restaurant.aggregate([
        {
          $search: {
            index: "default",
            text: {
              query: body.search,
              path: "restaurant_name",
              fuzzy: { maxEdits: 2, prefixLength: 0 }
            }
          }
        },
        { $match: { is_restaurant_verified: true, is_deleted: false } },
        { $limit: 10 }
      ]);

      let filterRestaurant = [];
      const relevantRestaurantSet = new Set();

      for (const filterRest of restaurant) {
        if (!relevantRestaurantSet.has(filterRest._id.toString())) {
          let withinRadius = true;

          if (body.lat && body.long) {
            const radius = await this.commonService.calculate_radius_distance(
              body.lat,
              body.long,
              filterRest.address?.lat || 0,
              filterRest.address?.long || 0
            );
            withinRadius = radius <= 12;
          }

          if (withinRadius) {
            relevantRestaurantSet.add(filterRest._id.toString());
            filterRestaurant.push(filterRest);
          }
        }
      }

      // Used Atlas Search for food items
      // let food = await this.model.food.aggregate([
      //   {
      //     $search: {
      //       index: "default",
      //       text: {
      //         query: body.search,
      //         path: ["name", "description"],
      //         fuzzy: { maxEdits: 3, prefixLength: 0 }
      //       }
      //     }
      //   },
      //   { $limit: 10 }
      // ]);

      let food = await this.model.food.aggregate([
        {
          $search: {
            index: "default", // your Atlas Search index
            compound: {
              should: [
                {
                  autocomplete: {
                    query: body.search,
                    path: "name",
                    fuzzy: { maxEdits: 2 }
                  }
                },
                {
                  text: {
                    query: body.search,
                    path: ["name", "description"],
                    fuzzy: { maxEdits: 2, prefixLength: 0 }
                  }
                }
              ]
            }
          }
        },
        { $limit: 10 }
      ]);
 


      // build response
      if (category) {
        return {
          dishes: category,
          relevant_restaurant: restaurant_with_food,
          matching_food: food_with_category,
        };
      } else if (restaurant.length > 0) {
        return {
          relevant_restaurant: filterRestaurant,
        };
      } else {
        return {
          matching_food: food,
        };
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }






  async Search(body) {
    try {
      let query;
      let food_with_category;
      let restaurant_with_food = [];

      let category = await this.model.category.findOne({
        category_name: { $regex: `^${body?.search}`, $options: 'i' },
      });
      if (category) {
        food_with_category = await this.model.food.find({
          is_deleted: false ,
          category_id: category._id,
        });

        if (food_with_category) {
          const restaurantSet = new Set();

          for (const food of food_with_category) {
            const restaurantId = food.restaurant_id.toString();

            // Check if the restaurant is already in the set
            if (!restaurantSet.has(restaurantId)) {
              // Fetch the restaurant and add it to the array if it hasn't been added yet
              const restaurant = await this.model.restaurant.findOne({
                _id: restaurantId
              });
              if (body.lat && body.long) {
                let radius
                restaurant_with_food.push({
                  ...restaurant.toObject(),
                });
                radius = await this.commonService.calculate_radius_distance(
                  body.lat,
                  body.long,
                  restaurant.address?.lat || 0,
                  restaurant.address?.long || 0,
                );

                if (radius <= 1200000000) {
                  restaurant_with_food.push({
                    ...restaurant.toObject(),
                  });
                }
              }
              restaurantSet.add(restaurantId); // Mark this restaurant as added
              if (restaurant_with_food.length >= 6) {
                break;
              }
            }

          }
        }
      }
      let filterRestaurant = []
      let restaurant = await this.model.restaurant.find({
        restaurant_name: { $regex: `^${body.search}`, $options: 'i' }, is_restaurant_verified: true
      });
      const relevantRestaurantSet = new Set();
      for (const filterRest of restaurant) {
        if (!relevantRestaurantSet.has(filterRest._id)) {
          if (body.lat && body.long) {
            const radius = await this.commonService.calculate_radius_distance(
              body.lat,
              body.long,
              filterRest.address?.lat || 0,
              filterRest.address?.long || 0,
            );
            if (radius <= 120000) {
              relevantRestaurantSet.add(filterRest._id);
              filterRestaurant.push({
                ...filterRest.toObject()
              })
            }
          }
        }



      }
      let food = await this.model.food.find({
        is_deleted: false ,
        name: { $regex: body.search, $options: 'i' },
      });

      if (category) {

        return {
          dishes: category,
          relevant_restaurant: restaurant_with_food,
          matching_food: food_with_category,
        };
      } else if (restaurant.length > 0) {
        return {
          relevant_restaurant: filterRestaurant,
        };
      } else {
        return {
          matching_food: food,
        };
      }
    } catch (error) {
      throw error;
    }
  }


  async updateLocationPoint(){

      const all_restaurant = await this.model.restaurant.find();
      all_restaurant.forEach(async (rest) => {
        if (rest.address) {
          const latlong: any = rest.address;
          await this.model.restaurant.updateOne({ _id: rest._id }, {
            location: {
              type: 'Point',
              coordinates: [parseFloat(latlong.long), parseFloat(latlong.lat)],
            }
          })
        }
      });
  }


  async DetailedSearch(body: any, user_id?) {
    try {

      let foodTypeFilter : any = {};
      const { lat, long, search = "", non_veg, veg, rating_4plus, sort_by, type }: DetailedSearchDto = body;

      const app_config: any = await this.model.appConfiguration.findOne({}, { show_restaurant_range: 1 }, { lean: true });
    
      // migrate location 
      await this.updateLocationPoint();

      body.veg === "true" ? foodTypeFilter = { food_type: { $in: ["veg"] } } : null
      body.non_veg === "true" ? foodTypeFilter = { food_type: { $in: ["non_veg", "egg"] } } : null

      if(body.isDineOut == "true"){
        foodTypeFilter.isDineOut = true;
      }

      let food = await this.model.food.aggregate([
        {
          $search: {
            index: "default", // your Atlas Search index
            compound: {
              should: [
                {
                  autocomplete: {
                    query: search,
                    path: "name",
                    fuzzy: { maxEdits: 2 }
                  }
                },
                {
                  text: {
                    query: search,
                    path: ["name", "description"],
                    fuzzy: { maxEdits: 2, prefixLength: 0 }
                  }
                }
              ]
            }
          }
        },
        { $limit: 10 },
        {
          $project: { restaurant_id: 1 }
        }
      ]);

      console.log("food ---", food);


      const [ category, restaurant, service_ids] = await Promise.all([
        this.model.category.find(
          { category_name: { $regex: search, $options: "i" } },
          { _id: 1 }
        ),
        this.model.restaurant.find({
          restaurant_name: { $regex: search, $options: "i" },
        }),


        this.model.ServicesModel.distinct('_id',{
          name: { $regex: search, $options: "i" },
        }),

      ]);

      const category_ids = category.map((ele) => ele._id);
      const category_food = category_ids.length
        ? await this.model.food.find(
        
          { is_deleted: false , category_id: { $in: category_ids }, ...foodTypeFilter },
          { restaurant_id: 1 }
        )
        : [];


        const restaurantWithServices = service_ids.length
        ? await this.model.restaurant.find(
          { services: { $in: service_ids } },
          { restaurant_id: 1 }
        )
        : [];

      const restaurant_ids = [
        ...new Set([

          ...food.map((ele) => ele.restaurant_id),
          ...category_food.map((ele) => ele.restaurant_id),

          ...restaurant.map((ele) => ele._id),
          ...restaurantWithServices.map((ele) => ele._id),
          
        ]),
      ];

    



      if (body.type === 'restaurant') {

        const pipeline = [];


        if (body.long && body.lat) {

          pipeline.push(
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(body.long), parseFloat(body.lat)],
                },
                distanceField: "distance", // in meter
                maxDistance: app_config.show_restaurant_range ? Number(app_config.show_restaurant_range) : 12000, // 12km
                spherical: true,
              },
            },
          );
        }

        if (sort_by === "distance") {
          pipeline.push(
            {
              $sort: { distance: -1 }
            }
          );
        }

        pipeline.push({
          $match: {
            _id: { $in: restaurant_ids },
            is_restaurant_verified: true,
            is_deleted: false,
            ...foodTypeFilter,
          },

        });

        pipeline.push(
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "restaurant_id",
              as: "reviews",
            },
          },
          {
            $addFields: {
              avg_rating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
              rating_count: { $ifNull: [{ $size: "$reviews" }, 0] },
            },
          }
        );

        if (body.rating_4plus === "true") {
          pipeline.push({ $match: { avg_rating: { $gte: 4 } } });
        }

        pipeline.push({
          $lookup: {
            from: "fooditems",
            localField: "_id",
            foreignField: "restaurant_id",
            as: "foods",
            pipeline: [
              { $match: { name: { $regex: new RegExp(body.search, "i") } } },
              {
                $lookup: {
                  from: "categories",
                  localField: "category_id",
                  foreignField: "_id",
                  as: "category",
                },
              },
              { $limit: 6 },
            ],
          },
        });

        if (category_ids.length > 0) {
          pipeline.push({
            $lookup: {
              from: "fooditems",
              localField: "_id",
              foreignField: "restaurant_id",
              as: "category_foods",
              pipeline: [
                { $match: { category_id: { $in: category_ids } } },
                {
                  $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                { $limit: 6 },
              ],
            },
          });
        }

        pipeline.push(
          {
            $lookup: {
              from: "favourites",
              let: { restro_id: "$_id", user_id: user_id || null },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$$restro_id", "$restaurant_id"] },
                        { $eq: ["$$user_id", "$customer_id"] },
                      ],
                    },
                  },
                },
              ],
              as: "favourites",
            },
          },
          {
            $addFields: {
              is_fav: {
                $cond: {
                  if: { $gt: [{ $size: "$favourites" }, 0] },
                  then: true,
                  else: false,
                },
              },
            },
          }
        );

        pipeline.push(
          {
            $addFields: {
              foods: { $concatArrays: ["$foods", "$category_foods"] },
            },
          },
          {
            $unwind: { path: "$foods", preserveNullAndEmptyArrays: true },
          },
          {
            $unwind: { path: "$foods.category", preserveNullAndEmptyArrays: true },
          },
          {
            $group: {
              _id: "$_id",
              restaurant_name: { $first: "$restaurant_name" },
              restaurant_phone: { $first: "$restaurant_phone" },
              average_preparing_time: { $first: "$average_preparing_time" },
              address: { $first: "$address" },
              country_code: { $first: "$country_code" },
              image: { $first: "$image" },
              food_licence_image: { $first: "$food_licence_image" },
              status: { $first: "$status" },
              working_day: { $first: "$working_day" },
              food_type: { $first: "$food_type" },
              is_active: { $first: true },
              is_block: { $first: "$is_block" },
              reason: { $first: "$reason" },
              rating: { $first: "$rating" },
              is_restaurant_verified: { $first: true },
              is_submit_verification: { $first: true },
              is_restaurant_update: { $first: true },
              total_orders: { $first: "$total_orders" },
              created_at: { $first: "$created_at" },
              location: { $first: "$location" },
              distance: { $first: "$distance" },
              category: { $addToSet: "$foods.category" }, // Ensures unique categories
              reviews: { $first: "$avg_rating" },
              rating_count: { $first: "$rating_count" },
              is_fav: { $first: "$is_fav" },
            },
          }
        );

        const restaurants = await this.model.restaurant.aggregate(pipeline);
        return { data: restaurants };

      }

      if (body.type === 'dishes') {
        let query = [
          await this.customerAggregation.matchRestaurant(restaurant_ids),
          await this.customerAggregation.FoodItemLookup(),
          await this.customerAggregation.ReviewLookup(),
          await this.customerAggregation.unwindReviews(),
          await this.customerAggregation.projectRestaurant(),

        ]
        const restaurants = await this.model.restaurant.aggregate(query);
        return { data: restaurants }
      }

    } catch (error) {
      throw error;
    }
  }

  async DetailedSearchOld(body, user_id?) {
    try {
      let food;
      let restaurant;
      let restaurant_with_food = [];
      let restUnder12KmRadius = []
      let foodTypeFilter = {};
      let query = {}
      body.search ? query = { restaurant_name: { $regex: body.search, $options: 'i' } } : null
      body.veg === "true" ? query = { food_type: { $in: ["veg"] } } : null
      body.non_veg === "true" ? query = { food_type: { $in: ["non_veg"] } } : null
      body.rating_4plus === "true" ? query = { rating: { $gte: 4 } } : null


      body.veg === "true" ? foodTypeFilter = { food_type: { $in: ["veg"] } } : null
      body.non_veg === "true" ? foodTypeFilter = { food_type: { $in: ["non_veg"] } } : null
      body.rating_4plus === "true" ? foodTypeFilter = { rating: { $gte: 4 } } : null
      
      let is_fav;
      if (body.type === 'restaurant') {
      
        const restaurantSet = new Set(); // Keep track of added restaurants
        const restaurant_with_food = [];
        const restaurant = await this.model.restaurant.find({ ...query, is_restaurant_verified: true });

        for (const filterRest of restaurant) {
          if (body.lat && body.long) {
            const radius = await this.commonService.calculate_radius_distance(
              body.lat,
              body.long,
              filterRest.address?.lat || 0,
              filterRest.address?.long || 0,
            );

            if (radius <= 120000) {
              if (!restaurantSet.has(filterRest._id.toString())) {
                const check_fav = await this.model.favourite.findOne({
                  customer_id: user_id,
                  restaurant_id: filterRest._id,
                });

                const is_fav = !!check_fav;

                const check_category = await this.model.food
                  .find({ restaurant_id: filterRest._id }, { category_id: 1 })
                  .populate([{ path: 'category_id' }]);

                const uniqueCategories = Array.from(new Set(check_category.map(food => food.category_id)));

                const category = await this.model.category.find({ _id: { $in: uniqueCategories } });

                const rating_count = await this.model.review.countDocuments({ restaurant_id: filterRest._id });

                restaurant_with_food.push({
                  ...filterRest.toObject(),
                  category,
                  rating_count,
                  is_fav,
                });

                restaurantSet.add(filterRest._id.toString()); // Add to Set
              }
            }
          }
        }

        // Handle food search
        const food = await this.model.food.find({
          is_deleted: false ,
          name: { $regex: body.search, $options: 'i' },
        });

        if (food.length > 0) {
          for (const foodItem of food) {
            const restaurantId = foodItem.restaurant_id.toString();

            if (!restaurantSet.has(restaurantId)) {
              const restaurant = await this.model.restaurant.findOne({
                _id: restaurantId, ...foodTypeFilter, is_restaurant_verified: true
              });

              if (restaurant) {
                const check_fav = await this.model.favourite.findOne({
                  customer_id: user_id,
                  restaurant_id: restaurantId,
                });

                const is_fav = !!check_fav;

                const check_category = await this.model.food
                  .find({ restaurant_id: restaurantId }, { category_id: 1 })
                  .populate([{ path: 'category_id' }]);

                const uniqueCategories = Array.from(new Set(check_category.map(food => food.category_id)));

                const category = await this.model.category.find({ _id: { $in: uniqueCategories } });

                const rating_count = await this.model.review.countDocuments({ restaurant_id: restaurant._id });

                let restaurantData = {
                  ...restaurant.toObject(),
                  category,
                  rating_count,
                  is_fav,
                };

                if (body.lat && body.long) {
                  const radius = await this.commonService.calculate_radius_distance(
                    body.lat,
                    body.long,
                    restaurant.address?.lat || 0,
                    restaurant.address?.long || 0,
                  );

                  if (radius <= 120000) {
                    restaurant_with_food.push(restaurantData);
                  }
                } else {
                  restaurant_with_food.push(restaurantData);
                }

                restaurantSet.add(restaurantId); // Add to Set to avoid duplication
              }
            }
          }
        }

        return { data: restaurant_with_food };

      }

      if (body.type === 'dishes') {
        // Find foods based on the search term
        let food = await this.model.food.find({
          is_deleted: false ,
          name: { $regex: body.search, $options: 'i' }, ...foodTypeFilter,
        });

        const restaurant_ids = food.map((ele) => ele.restaurant_id);
        const category_ids = food.map((ele) => ele.category_id);
        if (food.length > 0) {
          const restaurantMap = new Map();

          for (const find_food of food) {
            const restaurantId = find_food.restaurant_id.toString();
            // Check if the restaurant is already in the map
            if (!restaurantMap.has(restaurantId)) {
              // Fetch the restaurant and initialize its entry in the map
              const restaurant = await this.model.restaurant.findOne({
                _id: restaurantId, ...foodTypeFilter, is_restaurant_verified: true
              });
              let category
              if (restaurant) {
                let rating_count = await this.model.review
                  .countDocuments({ restaurant_id: restaurant._id })
                let check_category = await this.model.food
                  .find({ restaurant_id: restaurant._id }, { category_id: 1 })
                  .populate([{ path: 'category_id' }]);
                let uniqueCategories = Array.from(
                  new Set(check_category.map((food) => food.category_id)),
                );


                const foodItem = await this.model.food
                  .find({ restaurant_id: restaurant._id }, { category_id: 1 })
                  .populate([{ path: 'category_id' }]);

                // Get the full category details for unique category IDs
                let category = await this.model.category.find({
                  _id: { $in: uniqueCategories },
                });
                // Initialize the restaurant entry with food array
                restaurantMap.set(restaurantId, {
                  ...restaurant.toObject(),
                  foods: [],
                  // foods: foodItem,
                  category,
                  rating_count
                });
                if (body.lat && body.long) {
                  const radius = await this.commonService.calculate_radius_distance(
                    body.lat,
                    body.long,
                    restaurant.address?.lat || 0,
                    restaurant.address?.long || 0,
                  );

                  if (radius <= 120000) {
                    let rating_count = await this.model.review
                      .countDocuments({ restaurant_id: restaurant._id })
                    let check_category = await this.model.food
                      .find({ restaurant_id: restaurant._id }, { category_id: 1 })
                      .populate([{ path: 'category_id' }]);
                    let uniqueCategories = Array.from(
                      new Set(check_category.map((food) => food.category_id)),
                    );

                    // Get the full category details for unique category IDs
                    category = await this.model.category.find({
                      _id: { $in: uniqueCategories },
                    });
                    // Initialize the restaurant entry with food array
                    restaurantMap.set(restaurantId, {
                      ...restaurant.toObject(),
                      foods: [],
                      category,
                      rating_count
                    });
                  }
                }


              }

              // Add food items to the corresponding restaurant entry
              const restaurantEntry = restaurantMap.get(restaurantId);
              if (restaurantEntry) {
                restaurantEntry.foods.push({
                  ...find_food.toObject(),
                  // ...find_food.toObject(),
                  category

                  // or find_food.category_name if that's stored
                });
              }
            }
          }

          // Convert the map to an array for the final result
          const restaurant_with_food = Array.from(restaurantMap.values());
          return { data: restaurant_with_food };
        }

        let category = await this.model.category.find({
          category_name: { $regex: body.search, $options: 'i' }
        });
        // did not undetand the ongoing flow so i just added this when user search from category
        if (category.length > 0) {
          const restaurantMap = new Map();
          let all_ids = Array.isArray(category) ? category.map((item) => item._id) : [];
          const category_food = await this.model.food.find({ is_deleted: false , category_id: { $in: all_ids } });
          for (const find_food of category_food) {
            const restaurantId = find_food.restaurant_id.toString();

            // Check if the restaurant is already in the map
            if (!restaurantMap.has(restaurantId)) {
              // Fetch the restaurant and initialize its entry in the map
              const restaurant = await this.model.restaurant.findOne({
                _id: restaurantId, ...foodTypeFilter, is_restaurant_verified: true
              });
              let category
              if (restaurant) {
                let rating_count = await this.model.review
                  .countDocuments({ restaurant_id: restaurant._id })
                let check_category = await this.model.food
                  .find({ restaurant_id: restaurant._id }, { category_id: 1 })
                  .populate([{ path: 'category_id' }]);
                let uniqueCategories = Array.from(
                  new Set(check_category.map((food) => food.category_id)),
                );

                // Get the full category details for unique category IDs
                let category = await this.model.category.find({
                  _id: { $in: uniqueCategories },
                });
                // Initialize the restaurant entry with food array
                restaurantMap.set(restaurantId, {
                  ...restaurant.toObject(),
                  foods: [],
                  category,
                  rating_count
                });
                if (body.lat && body.log) {
                  const radius = await this.commonService.calculate_radius_distance(
                    body.lat,
                    body.long,
                    restaurant.address?.lat || 0,
                    restaurant.address?.long || 0,
                  );

                  if (radius <= 120000) {
                    let rating_count = await this.model.review
                      .countDocuments({ restaurant_id: restaurant._id })
                    let check_category = await this.model.food
                      .find({ restaurant_id: restaurant._id }, { category_id: 1 })
                      .populate([{ path: 'category_id' }]);
                    let uniqueCategories = Array.from(
                      new Set(check_category.map((food) => food.category_id)),
                    );

                    // Get the full category details for unique category IDs
                    category = await this.model.category.find({
                      _id: { $in: uniqueCategories },
                    });
                    // Initialize the restaurant entry with food array
                    restaurantMap.set(restaurantId, {
                      ...restaurant.toObject(),
                      foods: [],
                      category,
                      rating_count
                    });
                  }
                }


              }

              // Add food items to the corresponding restaurant entry
              const restaurantEntry = restaurantMap.get(restaurantId);
              if (restaurantEntry) {
                restaurantEntry.foods.push({
                  ...find_food.toObject(),
                  category

                  // or find_food.category_name if that's stored
                });
              }
            }
          }

          // Convert the map to an array for the final result
          const restaurant_with_food = Array.from(restaurantMap.values());
          return { data: restaurant_with_food };
        }



        restaurant = await this.model.restaurant.find({ ...query, is_restaurant_verified: true });
        for (const filterRest of restaurant) {
          const radius = await this.commonService.calculate_radius_distance(
            body.lat,
            body.long,
            filterRest.address?.lat || 0,
            filterRest.address?.long || 0,
          );

          if (radius <= 120000) {
            restUnder12KmRadius.push({
              ...filterRest.toObject()
            })
          }
        }
        if (restUnder12KmRadius.length > 0) {
          for (const find_restaurant of restUnder12KmRadius) {
            let rest_food = await this.model.food.find({
              is_deleted: false ,
              restaurant_id: find_restaurant._id, ...foodTypeFilter,
            });
            let rating_count = await this.model.review
              .countDocuments({ restaurant_id: find_restaurant._id })

            let check_category = await this.model.food
              .find({ restaurant_id: find_restaurant._id }, { category_id: 1 })
              .populate([{ path: 'category_id' }]);
            let uniqueCategories = Array.from(
              new Set(check_category.map((food) => food.category_id)),
            );

            // Get the full category details for unique category IDs
            let category = await this.model.category.find({
              _id: { $in: uniqueCategories },
            });

            restaurant_with_food.push({
              ...find_restaurant,
              foods: rest_food,
              rating_count,
              category

            });
          }

          return { data: restaurant_with_food };
        }
        else {
          return { data: restaurant_with_food };
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async YourOrderList(dto : YourOrdersDto, customer_id) {
    try {
      let {page, limit, order_status ,order_type} = dto; 

      let appConfig : any = await this.model.appConfiguration.findOne().select("is_fixed_time_delivery");
      let is_fixed_time_delivery = appConfig?.is_fixed_time_delivery || false;
      let options = await this.commonService.set_options(page, limit);
      let data_to_aggregate = [
        {
          $match: {
            is_fixed_time_delivery: is_fixed_time_delivery,
          }
        },
        await this.customerAggregation.match(customer_id, order_status,order_type),
        await this.customerAggregation.RestaurantLookup(),
        await this.customerAggregation.UnwindRestaurantLookup(),
        await this.customerAggregation.project(),
        await this.customerAggregation.face_set(options),
      ];
      let data = await this.model.order.aggregate(data_to_aggregate);
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async FindAllwithStatus(body, user) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);
      let data_to_aggregate;
      if (body.status === 'active') {
        data_to_aggregate = [
          await this.customerAggregation.Customermatch(),
          await this.customerAggregation.order_count_lookup(),
          await this.customerAggregation.AddField(),
          await this.customerAggregation.fillter_data(body.search),
          await this.customerAggregation.projectFields(),
          await this.customerAggregation.face_set(options),
        ];
      } else if (body.status === 'block') {
        data_to_aggregate = [
          await this.customerAggregation.BlockCustomerMatch(),
          await this.customerAggregation.order_count_lookup(),
          await this.customerAggregation.AddField(),
          await this.customerAggregation.fillter_data(body.search),
          await this.customerAggregation.projectFields(),
          await this.customerAggregation.face_set(options),
        ];
      } else if (body.status === 'deleted') {
        data_to_aggregate = [
          await this.customerAggregation.DeletedCustomermatch(),
          await this.customerAggregation.order_count_lookup(),
          await this.customerAggregation.AddField(),
          await this.customerAggregation.fillter_data(body.search),
          await this.customerAggregation.projectFields(),
          await this.customerAggregation.face_set(options),
        ];
      }else if (body.status === 'pending'){
        data_to_aggregate = [
          await this.customerAggregation.PendingCustomermatch(),
          await this.customerAggregation.order_count_lookup(),
          await this.customerAggregation.AddField(),
          await this.customerAggregation.fillter_data(body.search),
          await this.customerAggregation.projectFields(),
          await this.customerAggregation.face_set(options),
        ];
      }





      const data: any = await this.model.customer.aggregate(data_to_aggregate);
      // Mask sensitive fields here
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map(item =>
          isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item
        )
        : [];
      return { count: data[0]?.count[0]?.count, data: maskedData };

      //return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }


    async findAllForVendor(body, user) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);
      body.status = 'active';
      let data_to_aggregate = [
          await this.customerAggregation.Customermatch(),
          await this.customerAggregation.order_count_lookup(),
          await this.customerAggregation.AddField(),
          await this.customerAggregation.fillter_data(body.search),
          await this.customerAggregation.projectFields(),
          await this.customerAggregation.face_set(options),
        ];
      
      const data: any = await this.model.customer.aggregate(data_to_aggregate);
      
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };

      //return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }


  async customerDetailForAdmin(customer_id: string, user) {
    try {
      const data = await this.model.customer.findOne({ _id: new Types.ObjectId(customer_id) }).populate([
        { path: "current_address" },
        {path: "referral_user" , select : "name email country_code image phone"},
        { path: "report_reason_id" },

      ]).lean();
      const isSubadmin = user.scope === 'subadmin';
      const result = isSubadmin ? ResponseMapper.maskSensitiveFields(data) : data;
      const all_addresses = await this.model.customerAddress.find({ customer_id: data._id });

      let query : any = {
        customer_id: data._id,  
      };

      let pipeline = [
        await this.customerAggregation.filterOrder(query),
        await this.customerAggregation.orderGroup(),
        await this.customerAggregation.orderProject(),
      ];
      // calculate refund score 
      const [orderData] = await this.model.order.aggregate(pipeline);
      

      
      // current month data 
      const startOfMonth = moment.utc().startOf('month').valueOf();
      const endOfMonth = moment.utc().endOf('month').valueOf();

      query.created_at = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
      let currentMonthPipeline = [
        await this.customerAggregation.filterOrder(query),
        await this.customerAggregation.orderGroup(),
        await this.customerAggregation.orderProject(),
      ];
      const [currentMonthOrderData] = await this.model.order.aggregate(currentMonthPipeline);
    
      // total earning by customers 
      let earningQuery = {
        customer_id: data._id,
      };

      let earningPipeline = [
        await this.customerAggregation.filterOrder(earningQuery),
        await this.customerAggregation.earningGroup(),
        await this.customerAggregation.earningProject(),
      ];

      const [totalEarning] = await this.model.earnings.aggregate(earningPipeline);

      return { data: result, all_addresses: all_addresses, order_data: orderData, current_month_order_data : currentMonthOrderData  , earnings : totalEarning };
    } catch (error) {
      throw error;
    }
  }

  async block(body) {
    try {
      const user = await this.model.customer.findOne({
        _id: new mongoose.Types.ObjectId(body.customer_id),
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
        await this.commonService.SentEmailForBlockAccount(user, body);
        await this.model.session.deleteMany({
          user_id: body.customer_id,
        });
        query = { is_block: true, block_reason: body.reason };
      } else if (body.status === 'unblock') {
        query = { is_block: false };
        await this.commonService.SentEmailForUnBlockAccount(user, body);
      }
      const data = await this.model.customer.updateOne({ _id: body.customer_id }, query);
      return { message: 'Status update successfully' };
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }

  async customerOrders(body, user) {
    let options = await this.commonService.set_options(body.page, body.limit);
    try {
      let data_to_aggregate = [
        await this.customerAggregation.customer_match(body.customer_id),
        await this.customerAggregation.customer_lookup(),
        await this.customerAggregation.driver_lookup(),
        await this.customerAggregation.restaurant_lookup(),
        await this.customerAggregation.unwind__restaurantdata(),
        await this.customerAggregation.unwind__customerdata(),
        await this.customerAggregation.unwind_driverdata(),


        await this.customerAggregation.OrderProject(),
        await this.customerAggregation.face_set(options),
      ];
      const data = await this.model.order.aggregate(data_to_aggregate);
      // Mask sensitive fields here
      const isSubadmin = user.scope === 'subadmin';

      const maskedData = Array.isArray(data[0]?.data)
        ? data[0].data.map(item =>
          isSubadmin ? ResponseMapper.maskSensitiveFields(item) : item
        )
        : [];
      return { count: data[0]?.count[0]?.count, total_amount: data[0]?.total_amount[0]?.total_amount, data: maskedData };

      //return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      throw error;
    }
  }

  async customerActiveOrders(user: any) {
    try {
      if (!user) return null
      const { user_id } = user;

      const data_to_aggregate = [
        await this.customerAggregation.customer_active_order_status_match(user_id),
        await this.customerAggregation.RestaurantLookup(),
        await this.customerAggregation.UnwindRestaurantLookup(),
        await this.customerAggregation.driver_lookup(),
        await this.customerAggregation.unwind_driverdata(),
        await this.customerAggregation.project_active_order(),
      ];

      const data = await this.model.order.aggregate(data_to_aggregate);
      return { data: data }
    } catch (error) {
      throw error;
    }
  }



  async handleWalletAmount(customerId: Types.ObjectId, rewardAmount: number, credit_type: string, note: string) {

    const customer = await this.model.customer.findById(customerId);

    // Credit wallet to referrer
    let wallet = await this.model.walletModel.findOne({ customer_id: customerId });
    if (wallet) {
      wallet.balance += rewardAmount;
      await wallet.save();
    } else {
      wallet = await this.model.walletModel.create({
        customer_id: customerId,
        balance: rewardAmount,
      });
    }

    await this.model.walletTransactionModel.create({
      customer_id: customerId,
      type: WalletTxnType.CREDIT,
      credit_type: credit_type,
      amount: rewardAmount,
      description: note,
    });

  }

  
  async walletHistory(id: string, dto: CustomerWalletHistoryDto, payload: any) {

    let { page, limit } = dto;
    let skip = (page - 1) * limit;

    const customer = await this.model.customer.findById(id);
    if (!customer) {
      throw new HttpException(
        {
          error_code: 'provide valid id',
          error_description: 'provide valid id',
        },
        HttpStatus.BAD_REQUEST,
      );
    }


    let filter = { customer_id: customer._id };

    let wallet = await this.model.walletModel.findOne(filter);
    let total = await this.model.walletTransactionModel.countDocuments(filter);
    let history = await this.model.walletTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return { wallet, total, history }
  }



  async GetAllGroceryRestaurant(body: groceryRestaurentDto,page: number, limit: number, user_id?: string) {
    try {
      const skip = (page - 1) * limit;

      let type = (body.type !== undefined && body.type !== null)  ? body.type : RestaurantType.Grocery;
   
      const query: any = {
        status: restaurantStatus.Online,
        is_block: false,
        is_deleted: false,
        is_active: true,
        is_restaurant_verified: true,
        restaurant_type: type, 
      };

     
      const appConfiguration = await this.model.appConfiguration.findOne();
      let showRange = 10000;
      if (appConfiguration?.show_restaurant_range) {
        showRange = appConfiguration.show_restaurant_range;
      }

      const pipeline: any[] = [];

     
      if (body?.lat && body?.long) {
        pipeline.push(
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [parseFloat(body.long), parseFloat(body.lat)],
              },
              distanceField: 'distance',
              maxDistance: showRange,
              spherical: true,
            },
          },
          {
            $sort: { distance: 1 },
          },
        );
      }

      pipeline.push({ $match: query });


      pipeline.push({
        $lookup: {
          from: 'amenities',
          localField: 'amenities',
          foreignField: '_id',
          as: 'amenities',
        },
      });

    
      pipeline.push({
        $lookup: {
          from: 'services',
          localField: 'services',
          foreignField: '_id',
          as: 'services',
        },
      });

     
      if (user_id) {
        pipeline.push(
          {
            $lookup: {
              from: 'favourites',
              let: {
                restaurant_id: '$_id',
                customer_id: new mongoose.Types.ObjectId(user_id),
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$restaurant_id', '$$restaurant_id'] },
                        { $eq: ['$customer_id', '$$customer_id'] },
                      ],
                    },
                  },
                },
              ],
              as: 'favourites',
            },
          },
          {
            $addFields: {
              is_fav: { $gt: [{ $size: '$favourites' }, 0] },
            },
          },
        );
      } else {
        pipeline.push({
          $addFields: { is_fav: false },
        });
      }


      pipeline.push({
        $facet: {
          count: [{ $count: 'count' }],
          data: [
            { $sort: { _id: -1 } },
            {
              $project: {
                _id: 1,
                restaurant_name: 1,
                restaurant_phone: 1,
                address: 1,
                location: 1,
                image: 1,
                country_code: 1,
                services: 1,
                amenities: 1,
                rating: 1,
                total_orders: 1,
                restaurant_type: 1,
                is_fav: 1,
                is_delivery_available: 1,
                delivery_price_per_km: 1,
                delivery_range_in_km: 1,

                distance: {
                  distance :{
                    $round: [
                      { $divide: ['$distance', 1000] },
                      2
                    ]
                  },
                },
              },
            },
            { $skip: skip },
            { $limit: Number(limit) },
          ],
        },
      });


      const result = await this.model.restaurant.aggregate(pipeline);

      return {
        data_count: result[0]?.count[0]?.count ?? 0,
        data: result[0]?.data ?? [],
        deliveryFeeOptions : appConfiguration?.deliveryFeeOptions ?? null
        
      };
    } catch (error) {
      throw error;
    }
  }


}
