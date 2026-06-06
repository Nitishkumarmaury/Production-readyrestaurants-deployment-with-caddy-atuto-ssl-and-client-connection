import mongoose, { PipelineStage } from "mongoose";
import { OrderType } from "src/order/dto/order.dto";
import { OrderStatus, PaymentStatus } from "src/order/schema/order.schema";
export class CustomerAggregation {


  async match(customer_id: string, order_status?: string, order_type?: string) {
    try {
      const match: any = {
        customer_id: new mongoose.Types.ObjectId(customer_id),
        payment_status: { $ne: PaymentStatus.Pending }


      };

      if (order_status) {
        match.order_status = order_status;
      } else {
        match.order_status = { $ne: OrderStatus.upcomming };
      }

      if (order_type) {
        match.order_type = order_type;
      } else {
        match.order_type = { $eq: OrderType.Current };
      }

      return { $match: match };
    } catch (error) {
      throw error;
    }
  }




  async RestaurantLookup() {
    try {
      return {
        $lookup: {
          from: 'restaurants',
          let: { restaurant_id: '$restaurant_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$restaurant_id', '$_id'] }
                  ]
                }
              }
            },
            {
              $project: {
                restaurant_name: 1,
                address: 1,
                image: 1,
                food_type: 1
              }
            }

          ],
          as: 'restaurant'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async UnwindRestaurantLookup() {
    try {
      return {
        $unwind: {
          path: "$restaurant",
          preserveNullAndEmptyArrays: true
        }
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }
  async project() {
    return {
      $project: {
        restaurant: 1,
        cart_items: 1,
        grocery_cart_items: 1,
        total_amount: 1,
        order_placed_at: 1,
        order_id: 1,
        ride_status: 1,
        order_status: 1,

        is_fixed_time_delivery : 1,
        fixed_time_delivery : 1,
        driver: 1
      }
    }
  }

  async project_active_order() {
    return {
      $project: {
        restaurant: 1,
        cart_items: 1,
        grocery_cart_items: 1,
        total_amount: 1,
        order_placed_at: 1,
        order_id: 1,
        ride_status: 1,
        order_status: 1,
        driver: {
          _id: 1,
          name: 1,
          image: 1,
          phone: 1,
          country_code: 1,
        }
      }
    }
  }

  async face_set(option) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: "count"
            },
          ],

          total_order_earning: [
                        {
                            $group: {
                                _id: null,
                                total_earning: { $sum: "$total_earning" }
                            }
                        }
                  ],

          total_amount: [
            {
              $group: {
                _id: null,
                total_amount: { $sum: { $ifNull: ["$total_amount", 0] } }
              }
            }
          ],

          data: [
            {
              $sort: {
                _id: -1 as 1 | -1
              }
            },
            {
              $skip: option.skip
            },
            {
              $limit: option.limit
            }
          ]
        }
      }
    } catch (error) {
      throw error
    }
  }





  async Customermatch() {
    try {
      return {
        $match: { is_active: true, is_block: false, is_deleted: false, is_email_verify: true, is_phone_verify: true },
      };
    } catch (error) {
      console.log("error", error);

    }
  }

  async DeletedCustomermatch() {
    try {
      return {
        $match: { is_deleted: true },
      };
    } catch (error) {
      console.log("error", error);

    }
  }

  async PendingCustomermatch(){

    try {
      return {
        $match: { $or : [
          { is_active: false },
          { is_email_verify: false },
          { is_phone_verify: false }
        ]},
      };
    } catch (error) {
      console.log("error", error);
    }
  }

  async BlockCustomerMatch() {
    try {
      return {
        $match: { is_block: true, is_deleted: false },
      };
    } catch (error) {
      console.log("error", error);

    }
  }

  async order_count_lookup() {
    return {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customer_id',
        as: 'orders'
      },
    }
  }

  async AddField() {
    return {
      $addFields: {
        orderCount: { $size: '$orders' }
      }
    }
  }

  async customer_address_lookup() {
    return {
      $lookup: {
        from: 'customeraddresses',
        localField: '_id',
        foreignField: 'customer_id',
        as: 'current_address'
      },
    }
  }


  async fillter_data(search: any) {
    try {
      console.log(search);

      return {
        $redact: {
          $cond: {
            if: {
              $and: [
                {
                  $or: [
                    { $eq: [search, undefined] },
                    {
                      $regexMatch: {
                        input: '$name',
                        regex: search,
                        options: 'i',
                      },
                    },
                    {
                      $regexMatch: {
                        input: '$phone',
                        regex: search,
                        options: 'i',
                      },
                    },
                  ],
                },
              ],
            },
            then: '$$KEEP',
            else: '$$PRUNE',
          },
        },
      };
    } catch (error) { }
  }



  async projectFields() {
    return {
      $project: {
        _id: 1,
        name: 1,
        phone: 1,
        country_code: 1,
        email: 1,
        image: 1,
        is_active: 1,
        is_block: 1,
        is_deleted: 1,
        orderCount: 1,
        current_address: 1
      }
    };
  }

  async customer_match(id) {
    try {
      return {

        $match: { customer_id: new mongoose.Types.ObjectId(id) }

      }
    } catch (error) {
      console.log("error", error);
      throw error;

    }
  }

  async customer_active_order_status_match(customer_id: string) {
    try {
      return {
        $match: {
          customer_id: new mongoose.Types.ObjectId(customer_id),
          order_status: { $in: [OrderStatus.OrderPlaced, OrderStatus.OrderConfirmed, OrderStatus.ReadyForPickup, OrderStatus.PickedUp, OrderStatus.OutForDelivery] },
          payment_status: { $ne: PaymentStatus.Pending }
        }
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async driver_match(id) {
    try {
      return {

        $match: { driver_id: new mongoose.Types.ObjectId(id) }

      }
    } catch (error) {
      console.log("error", error);
      throw error;

    }
  }

  async customer_lookup() {
    try {
      return {
        $lookup: {
          from: 'customers',  // The name of the customers collection
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      }

    } catch (error) {

    }
  }

  async vehicle_lookup() {
    try {
      return {
        $lookup: {
          from: 'vehicle_types',  // The name of the customers collection
          localField: 'vehicle_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      }

    } catch (error) {

    }
  }

  async driver_lookup() {
    try {

      return {
        $lookup: {
          from: 'drivers',  // The name of the drivers collection
          localField: 'driver_id',
          foreignField: '_id',
          as: 'driver'
        }
      }
    } catch (error) {

    }
  }

  async restaurant_lookup() {
    try {

      return {
        $lookup: {
          from: 'restaurants',  // The name of the drivers collection
          localField: 'restaurant_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      }
    } catch (error) {

    }
  }

  async unwind__customerdata() {
    try {
      return {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true  // In case there's no corresponding customer
        }
      }
    } catch (error) {
      throw error
    }
  }

  async unwind__restaurantdata() {
    try {
      return {
        $unwind: {
          path: '$restaurant',
          preserveNullAndEmptyArrays: true  // In case there's no corresponding customer
        }
      }
    } catch (error) {
      throw error
    }
  }

  async unwind_driverdata() {
    try {
      return {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true  // In case there's no corresponding driver
        }
      }
    } catch (error) {
      throw error
    }
  }

  async lookupOrderEarning() {
        try {
            return {
                $lookup: {
                    from: 'earnings',
                    let: { order_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$$order_id', '$order_id'] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                commission_from_restaurant: 1,
                                commission_from_driver: 1,
                                coupon_amount : 1,
                            }
                        }
                    ],
                    as: 'earnings'
                }
            };
        } catch (error) {
            throw error;
        }
    }

  async OrderProject() {
    return {
      $project: {

        order_id: 1,
        delivery_address: 1,
        drop_address: 1,
        order_status: 1,
        total_amount: 1,
        created_at: 1,
        'customer.name': 1,
        'driver.name': 1,
        'restaurant.restaurant_name': 1,
        total_earning : 1
      }
    };
  }
  async filterByLatLong(lat, long, restaurant_range): Promise<PipelineStage.GeoNear> {
    try {
      return {

        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(long), parseFloat(lat)] as [number, number],
          },
          distanceField: "distance",
          maxDistance: restaurant_range ? Number(restaurant_range) : 12000, // 12km
          spherical: true,
        },
      }
    }
    catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async matchRestaurant(res_ids) {
    try {
      return {
        $match: { _id: { $in: res_ids } }
      }
    } catch (error) {
      throw error
    }
  }

  async FoodItemLookup() {
    try {
      return {
        $lookup: {
          from: 'fooditems',
          let: { restaurant_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$restaurant_id', '$restaurant_id'] }
                  ]
                }
              }
            },

            {
              $lookup: {
                from: 'categories',
                let: { category_id: '$category_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$category_id'] }
                        ]
                      }
                    }
                  },
                ],
                as: 'category'
              }
            },
            // {
            //   $project: { category: 0 }
            // }
          ],
          as: 'foods'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async unwindFoodItem() {
    try {
      return {
        $unwind: {
          path: "$foods",
          preserveNullAndEmptyArrays: true
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async ReviewLookup() {
    try {
      return {
        $lookup: {
          from: 'reviews',
          let: { restaurant_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$$restaurant_id', '$restaurant_id']
                }
              }
            },
            {
              $group: {
                _id: null,
                avg_rating: { $avg: '$rating' },
                rating_count: { $sum: 1 }
              }
            }
          ],
          as: 'reviews'
        }
      };
    } catch (error) {
      throw error;
    }
  }
  async unwindReviews() {
    try {
      return {
        $unwind: {
          path: "$reviews",
          preserveNullAndEmptyArrays: true
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async projectRestaurant() {
    return {
      $project: {
        _id: 1,
        restaurant_name: 1,
        restaurant_phone: 1,
        average_preparing_time: 1,
        address: 1,
        country_code: 1,
        image: 1,
        food_licence_image: 1,
        status: 1,
        working_day: 1,
        food_type: 1,
        is_active: 1,
        is_block: 1,
        reason: 1,
        rating: 1,
        is_restaurant_verified: 1,
        is_submit_verification: 1,
        is_restaurant_update: 1,
        total_orders: 1,
        created_at: 1,
        location: 1,
        distance: 1,
        category: { $arrayElemAt: ["$foods.category", 0] },
        foods: 1,
        reviews: "$reviews.avg_rating",
        rating_count: "$reviews.rating_count"

      }
    }
  }

  async addReviews() {
    try {
      return {
        $set: {
          rating: {
            $ifNull: [
              { $avg: "$reviews.avg_rating" }, // Correct usage: average over array of embedded field
              0
            ]
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }
  async projectReviews() {
    try {
      return {
        $project: {
          _id: 1,
          restaurant_id: 1,
          customer_id: 1,
          rating: 1,
          review: 1,
          created_at: 1,
          updated_at: 1
        }
      }
    } catch (error) {
      throw error;
    }
  }


  async filterOrder(query){
    try {
      return {
        $match: query
      }
    } catch (error) {
      throw error;
    }
  }

  async orderGroup(){
    try {
      return {
          $group: {
            _id: null,
            // total_orders: { $sum: 1 },
            payment_complete_orders: {
              $sum: {
                $cond: [
                  { $eq: ["$payment_status", PaymentStatus.Complete] },
                  1,
                  0
                ]
              }
            },
            refund_orders: {
              $sum: {
                $cond: [
                  { $eq: ["$payment_status", PaymentStatus.Refunded] },
                  1,
                  0
                ]
              }
            },
          }
        };



    } catch (error) {
      throw error;
    }
  }

  async orderProject(){
    try {
      return {
                $project: {
                  _id : 0,
                  no_of_total_orders: { $add: ["$payment_complete_orders", "$refund_orders"] },
                  payment_complete_orders: 1,
                  no_of_refund_orders: "$refund_orders",
                  refund_score: {
                    $cond: [
                      {
                        $eq: [
                          { $add: ["$payment_complete_orders", "$refund_orders"] },
                          0
                        ]
                      },
                      0,
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$refund_orders",
                              {
                                $add: ["$payment_complete_orders", "$refund_orders"]
                              }
                            ]
                          },
                          100
                        ]
                      }
                    ]
                  }
                }
              };

    } catch (error) {
      throw error;
    }
  }


  async earningGroup (){

    return {
          $group: {
            _id: null,

            total_amount: { $sum: "$total_amount" },
            restaurant_earning: { $sum: "$restaurant_earning" },
            driver_earning: { $sum: "$driver_earning" },
            tax: { $sum: "$tax" },
            coupon_amount: { $sum: "$coupon_amount" },
            admin_earning: { $sum: "$admin_earning"  },
            
            commission_from_driver: { $sum: "$commission_from_driver" },
            commission_from_restaurant: { $sum: "$commission_from_restaurant" }
          }
        }

  }

  async earningProject(){
   return  {
              $project: {
                _id: 0,
                total_amount: 1,
                restaurant_earning: 1,
                driver_earning: 1,
                tax: 1,
                coupon_amount : 1,
                commission_from_driver: 1,
                commission_from_restaurant : 1,
                admin_earning: {
                  $subtract: [
                    {
                      $add: [
                        { $ifNull: ["$commission_from_driver", 0] },
                        { $ifNull: ["$commission_from_restaurant", 0] }
                      ]
                    },
                    { $ifNull: ["$coupon_amount", 0] }
                  ]
              }
            }
          }

  }
}