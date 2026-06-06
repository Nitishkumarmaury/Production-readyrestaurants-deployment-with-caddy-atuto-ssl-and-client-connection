import * as mongoose from 'mongoose';
import { last } from 'rxjs';
export class AdminAggregation {
  async match() {
    try {
      return {
        $match: { is_active: true, is_block: false, is_deleted: false, is_email_verify: true, is_phone_verify: true }
      }
    } catch (error) {
      throw error
    }

  }
  async drivermatch() {
    try {
      return {
        $match: { is_active: true, is_approved: true, is_deleted: false, is_block: false }
      }
    } catch (error) {
      throw error
    }

  }

  async restaurantMatch() {
    try {
      return {
        $match: {
          is_active: true,
          is_block: false,
          is_restaurant_verified: true
        }
      }
    } catch (error) {
      throw error
    }

  }


  async vendorLookup() {
    try {
      return {
        $lookup: {
          from: 'vendors',
          let: { user_id: '$vendor_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$user_id']

                },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1
              }
            }
          ],
          as: 'vendor',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async UnwindvendorLookup() {
    try {
      return {
        $unwind: {
          path: "$vendor",
          preserveNullAndEmptyArrays: false
        }
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async selectedmatch(ids) {
    try {
      console.log("Selected IDs:", ids);
      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

      return {
        $match: { _id: { $in: objectIds } }
      };
    } catch (error) {
      throw error;
    }
  }

  async SessionLookup() {
    try {
      return {
        $lookup: {
          from: 'sessions',
          let: { user_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },

                  ],
                },
              },
            },
            {
              $project: {
                fcm_token: 1
              }
            }
          ],
          as: 'sessions',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async RestaurantSessionLookup() {
    try {
      return {
        $lookup: {
          from: 'sessions',
          let: { user_id: '$vendor._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$user_id', '$$user_id']
                },
              },
            }

          ],
          as: 'sessions',
        },
      };
    } catch (error) {
      throw error;
    }
  }


  async project() {
    try {
      return {
        $project: {
          phone : 1,
          email: 1,
          vendor: 1,
          sessions: 1
        }
      }
    } catch (error) {
      throw error
    }
  }

  async projectVendor() {
    try {
      return {
        $project: {
          email: "$vendor.email",
          vendor: 1,
          sessions: 1
        }
      }
    } catch (error) {
      throw error
    }
  }


  async topDriversPipline() {

    let pipeline: any = [];

    pipeline.push({
      $match: {
        is_active: true, is_approved: true, is_deleted: false, is_block: false
      }
    })

    pipeline.push(
      {
        $lookup: {
          from: 'orders',
          let: { driver_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$driver_id', '$$driver_id']
                },

                order_status: "delivered",
              },
            },

            {
              $project: {
                _id: 1,
                restaurant_id: 1,
                customer_id: 1,
                order_id: 1,
                order_status: 1,
              }
            },
          ],
          as: 'orders',
        },
      },

      {
        // Add order count
        $addFields: {
          order_count: { $size: "$orders" }
        }
      }
    )



    pipeline.push(
      {
        $lookup: {
          from: 'earnings',
          let: { driver_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$driver_id', '$$driver_id']
                },
              },
            },

            {
              $project: {
                _id: 1,
                driver_earning: 1,
                // restaurant_id: 1,
                // customer_id: 1,
                // order_id: 1, 
                // order_status: 1,
              }
            },
          ],
          as: 'earnings',
        },
      },

      {
        // Add order count
        $addFields: {

          total_driver_earning: {
            $sum: "$earnings.driver_earning"
          },


        }
      }
    )



    pipeline.push({
      $project: {
        name: 1,
        email: 1,
        country_code: 1,
        phone: 1,
        image: 1,
        order_count: 1,
        total_driver_earning: 1,
        // earnings : 1
      }
    });

    pipeline.push({
      $match: {
        order_count: { $gte: 1 }
      }
    });

    pipeline.push({
      $sort: {
        order_count: -1   // -1 = highest first, 1 = lowest first
      }
    });

    pipeline.push({
      $limit: 10
    });

    return pipeline;
  }



  async topRestaurantPipline() {

    let pipeline: any = [];

    pipeline.push({
      $match: {
        is_active: true,
        is_block: false,
        is_restaurant_verified: true,
        is_deleted: false
      }
    })

    pipeline.push(
      {
        $lookup: {
          from: 'orders',
          let: { restaurant_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$restaurant_id', '$$restaurant_id']
                },
                order_status: "delivered",
              },
            },

            {
              $project: {
                _id: 1,
                restaurant_id: 1,
                customer_id: 1,
                order_id: 1,
                order_status: 1,
              }
            },
          ],

          as: 'orders',
        },
      },

      {
        // Add order count
        $addFields: {
          order_count: { $size: "$orders" }
        }
      }
    )




    pipeline.push(
      {
        $lookup: {
          from: 'earnings',
          let: { restaurant_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$restaurant_id', '$$restaurant_id']
                },
              },
            },

            {
              $project: {
                _id: 1,
                restaurant_earning: 1,

              }
            },
          ],

          as: 'earnings',
        },
      },

      {
        // Add order count
        $addFields: {
          total_restaurant_earning: {
            $sum: "$earnings.restaurant_earning"
          },
        }
      },
    )



    pipeline.push(
      {
        $lookup: {
          from: 'vendors',
          let: { vendor_id: '$vendor_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$vendor_id']
                },
              },
            },

            // {
            //   $project: {
            //     _id: 1,
            //     restaurant_earning: 1,

            //   }
            // },
          ],

          as: 'vendor',
        },
      },
    )

    pipeline.push({
      $unwind: {
        path: "$vendor",
        preserveNullAndEmptyArrays: false
      }
    }
      
    )

    pipeline.push({
      $project: {
        restaurant_name: 1,
        status: 1,
        country_code: 1,
        restaurant_phone: 1,
        image: 1,

        // orders : 1,

        order_count: 1,
        total_restaurant_earning: 1,
        email: "$vendor.email"
      }
    });


    pipeline.push({
      $match: {
        order_count: { $gte: 1 }
      }
    });

    pipeline.push({
      $sort: {
        order_count: -1   // -1 = highest first, 1 = lowest first
      }
    });

    pipeline.push({
      $limit: 10
    });

    return pipeline;
  }

  // async topCustomerPipLine() {
  //   const pipeline: any[] = [];

  //   pipeline.push({
  //     $match: {
        
  //       order_status: "delivered",
  //       payment_status: "completed",
  //       customer_id: { $ne: null },
  //     }
  //   });

  //   pipeline.push({
  //     $group: {
  //       _id: '$customer_id',
  //       total_orders: { $sum: 1 },
  //       total_spent: { $sum: '$total_amount' },
  //       last_order_at: { $max: '$created_at' },
  //     }
  //   });

  //   pipeline.push({
  //     $lookup: {
  //       from: 'customers',
  //       localField: 'customer_id',
  //       foreignField: '_id',
  //       as: 'customer_info',
  //     }
  //   });

  //   pipeline.push({
  //     $unwind: '$customer_info'
  //   });

  //   pipeline.push({
  //     $project: {
  //       _id: 0,
  //       customer_id: '$_id',
  //       name: '$customer.name',
  //       email: '$customer.email',
  //       phone: '$customer.phone',
  //       image: '$customer.image',
  //       total_orders: 1,
  //       total_spent: 1,
  //       last_order_at: 1,
  //     },
  //   });

  //   pipeline.push({
  //     $sort: {
  //       total_orders: -1,
  //     },
  //   });

  //   pipeline.push({ $limit: 10 });

  //   return pipeline;

  // }



  async topCustomerPipline() {
    const pipeline: any = [];

    pipeline.push({
      $match: {
        is_active: true,
        is_block: false,
        is_deleted: false,
        is_email_verify : true,
        is_phone_verify : true
      }
    });

   
    pipeline.push({
      $lookup: {
        from: 'orders',
        let: { customer_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$customer_id', '$$customer_id'] },
              order_status: 'delivered'
            }
          },
          {
            $project: {
              _id: 1,
              restaurant_id: 1,
              customer_id: 1,
              order_id: 1,
              order_status: 1
            }
          }
        ],
        as: 'orders'
      }
    });

  
    pipeline.push({
      $addFields: {
        order_count: { $size: '$orders' }
      }
    });

    pipeline.push({
      $match: {
        order_count: { $gte: 1 }
      }
    });



    pipeline.push({
      $lookup: {
        from: 'slots',
        let: { customer_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$customer_id', '$$customer_id'] },
              status: 'Booked'
            }
          },
          {
            $group: {
              _id: '$customer_id',
              booking_count: { $sum: 1 }
            }
          }
        ],
        as: 'bookings'
      }
    });

 
    pipeline.push({
      $addFields: {
        booking_count: { $ifNull: [{ $first: '$bookings.booking_count' }, 0] }
      }
    });

    pipeline.push({
      $project: {
        name: 1,
        email: 1,
        country_code: 1,
        phone: 1,
        image: 1,
        order_count: 1,
        booking_count: 1
      }
    });

   
    pipeline.push({
      $sort: {
        order_count: -1,
        booking_count: -1
      }
    });

  
    pipeline.push({ $limit: 10 });

    return pipeline;
  }






}



