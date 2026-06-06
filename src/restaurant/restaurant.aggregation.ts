import mongoose from 'mongoose';
import { OrderStatus, PaymentStatus } from 'src/order/schema/order.schema';
import { pipeline } from 'stream';

export class RestaurantAggregation {
  async match(query, searchQuery) {
    try {
      return {
        $match: {
          ...query,
          ...searchQuery,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async VendorLookup() {
    try {
      return {
        $lookup: {
          from: 'vendors',
          let: { vendor_id: '$vendor_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$$vendor_id', '$_id'] }],
                },
              },
            },
            {
              $project: {
                name: 1,
                country_code: 1,
                phone: 1,
                is_deleted: 1,
              },
            },
          ],
          as: 'vendor',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async unwindVendor() {
    try {
      return {
        $unwind: {
          path: '$vendor',
          preserveNullAndEmptyArrays: true,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async OrderLookup() {
    try {
      return {
        $lookup: {
          from: 'orders',
          let: { rest_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$rest_id', '$restaurant_id'] },
              },
            },
          ],
          as: 'orders',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async lookupEarning() {
    try {
      return {
        $lookup: {
          from: 'earnings',
          let: { rest_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$rest_id', '$restaurant_id'] },
              },
            },
            {
              $project: {
                _id: 0,
                commission_from_restaurant: 1,
              },
            },
          ],
          as: 'earnings',
        },
      };
    } catch (error) {
      throw error;
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
                $expr: { $eq: ['$$order_id', '$order_id'] },
              },
            },
            {
              $project: {
                _id: 0,
                commission_from_restaurant: 1,
                commission_from_driver: 1,
                coupon_amount: 1,
              },
            },
          ],
          as: 'earnings',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async addFieldsCount() {
    try {
      return {
        $addFields: {
          total_orders: { $size: '$orders' },
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
          restaurant_name: 1,
          country_code: 1,
          restaurant_phone: 1,
          qr_code_image: 1,
          qr_code_for_table : 1,
          images: 1,
          rating: 1,
          total_orders: 1,
          vendor: 1,
          reason: 1,
          created_at: 1,
          updated_at: 1,
          createdAt: 1,
          updatedAt: 1,
          is_restaurant_verified: 1,
          is_submit_verification: 1,
          is_restaurant_update: 1,
          ratings: 1,
          restaurant_type: 1,

          status: 1,
          isFoodDelivery: 1,
          isDineOut: 1,
          catering_services: 1,

          total_restaurant_earning: 1,
          // earnings: 1
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async face_set(option) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],

          total_order_earning: [
            {
              $group: {
                _id: null,
                total_earning: { $sum: '$total_earning' },
              },
            },
          ],

          total_restaurant_earnings: [
            {
              $group: {
                _id: null,
                total_restaurant_earning: { $sum: '$total_restaurant_earning' },
              },
            },
          ],

          data: [
            {
              $sort: {
                _id: -1 as 1 | -1,
              },
            },
            {
              $skip: option.skip,
            },
            {
              $limit: option.limit,
            },
          ],
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async face_set_sort_update(option) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],
          data: [
            {
              $sort: {
                updated_at: -1 as 1 | -1,
              },
            },
            {
              $skip: option.skip,
            },
            {
              $limit: option.limit,
            },
          ],
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async restaurantMatch(restaurant_id) {
    try {
      return {
        $match: {
          restaurant_id: new mongoose.Types.ObjectId(restaurant_id), // Ensuring ObjectId format for matching
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driverLookUp() {
    try {
      return {
        $lookup: {
          from: 'drivers',
          localField: 'driver_id', // Use direct field matching (driver_id) instead of `$let`
          foreignField: '_id', // Match the `_id` field from 'drivers' collection
          as: 'driver', // Save the driver details in 'driver'
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async unwindDriver() {
    try {
      return {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true, // Allow documents without drivers to still appear
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async customerLookUp() {
    try {
      return {
        $lookup: {
          from: 'customers',
          localField: 'customer_id', // Directly match customer_id
          foreignField: '_id', // Match the `_id` field from 'customers'
          as: 'customer', // Save customer details in 'customer'
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async unwindCustomer() {
    try {
      return {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true, // Allow documents without customers to still appear
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  async orderProject() {
    try {
      return {
        $project: {
          order_id: 1,
          delivery_address: 1,
          total_amount: 1,
          order_status: 1,
          'customer.name': 1,
          'driver.name': 1,
          total_earning: 1,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  baseOrderMatch(restaurant_id: string) {
    return {
      restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
    };
  }

  earningAndOrderGroup() {
    return {
      $group: {
        _id: null,
        earning: { $sum: '$restaurant_earning' },
        orders: { $sum: 1 },
      },
    };
  }

  dateMatch(start: number, end: number, baseMatch: any) {
    return {
      $match: {
        ...baseMatch,
        created_at: {
          $gte: start,
          $lte: end,
        },
      },
    };
  }

  graphBaseMatch(restaurant_id: string, start: number, end: number) {
    return {
      $match: {
        restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
        created_at: {
          $gte: start,
          $lte: end,
        },
      },
    };
  }

  graphGroupByDay() {
    return {
      $group: {
        _id: {
          date: {
            $dateTrunc: {
              date: { $toDate: '$createdAt' },
              unit: 'day',
            },
          },
        },
        earning: { $sum: '$restaurant_earning' },
        orders: { $sum: 1 },
      },
    };
  }

  graphProjectLabel() {
    return {
      $project: {
        _id: 0,
        sortDate: '$_id.date',
        label: {
          $dateToString: {
            format: '%d %b',
            date: '$_id.date',
          },
        },
        earning: { $round: ['$earning', 2] },
        orders: 1,
      },
    };
  }

  graphSort() {
    return {
      $sort: { sortDate: 1 as 1 | -1 },
    };
  }

  graphFinalProject() {
    return {
      $project: {
        sortDate: 0,
      },
    };
  }

  // ============ NEW METHODS FOR EARNINGS AND ORDERS ============

  // Base match for earnings (same as baseOrderMatch, but keeping for clarity)
  baseEarningMatch(restaurant_id: string) {
    return {
      restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
    };
  }

  // Driver match for vendor
  async driverMatchForVendor(searchQuery) {
    try {
      return {
        $match: {
          ...searchQuery,
          is_active: true,
          is_approved: true,
          is_deleted: false,
          is_block: false,
        },
      };
    } catch (error) {
      console.log('error', error);
    }
  }

  async driverPaginationForVendor(options) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],
          data: [
            {
              $sort: {
                _id: -1 as 1 | -1,
              },
            },
            {
              $skip: options.skip,
            },
            {
              $limit: options.limit,
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                country_code: 1,
                phone: 1,
                image: 1,
                // formatted_address: 1,
                // latitude: 1,
                // longitude: 1,
                // location: 1,
                vehicle_id: 1,
                is_active: 1,
                is_block: 1,
                is_approved: 1,
                // is_deleted: 1,
                status: 1,
                ride_status: 1,
                ratings: 1,
                // zone_id: 1,
                // created_at: 1,
                // updated_at: 1,
                restaurantdrivers : 1
              },
            },
          ],
        },
      };
    } catch (error) {
      console.log('error', error);
    }
  }

  // Driver lookup for restaurant
  async driverLookupForRestaurant(restaurant) {
    try {
      return {
          $lookup: {
            from: 'restaurantdrivers',
            let: { driver_id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$restaurant_id', restaurant._id],
                      },
                      {
                        $eq: ['$driver_id', '$$driver_id'],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'restaurantdrivers',
          },
        }


    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async unwindDriverForRestaurant(){
    return {
          $unwind: {
            path: '$restaurantdrivers',
            preserveNullAndEmptyArrays: true,
          },
        }

  }


  // Unwind drivers
  async unwindDrivers() {
    try {
      return {
        $unwind: {
          path: '$drivers',
          preserveNullAndEmptyArrays: true,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  // Driver project fields
  async driverProjectFields() {
    try {
      return {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          country_code: 1,
          image: 1,
          is_active: 1,
          status: 1,
          ride_status: 1,
          ratings: 1,
          location: 1,
          formatted_address: 1,
          vehicle_id: 1,
          created_at: 1,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  // Base match for delivered orders
  baseDeliveredOrderMatch(restaurant_id: string) {
    return {
      restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
      order_status: 'delivered',
    };
  }

  // Date range match helper
  dateRangeMatch(start?: number, end?: number) {
    if (!start || !end) return {};

    return {
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
  }

  // Earning group stage (sum only earnings)
  earningGroup() {
    return {
      $group: {
        _id: null,
        earning: { $sum: '$restaurant_earning' },
      },
    };
  }

  // Orders count group stage (count only)
  ordersGroup() {
    return {
      $group: {
        _id: null,
        orders: { $sum: 1 },
      },
    };
  }

  // Complete earnings pipeline builder
  buildEarningsPipeline(restaurant_id: string, start?: number, end?: number) {
    const pipeline: any[] = [{ $match: this.baseEarningMatch(restaurant_id) }];

    if (start && end) {
      pipeline.push({
        $match: this.dateRangeMatch(start, end),
      });
    }

    pipeline.push(this.earningGroup());

    return pipeline;
  }

  // Complete delivered orders pipeline builder
  buildDeliveredOrdersPipeline(
    restaurant_id: string,
    start?: number,
    end?: number,
  ) {
    const pipeline: any[] = [
      { $match: this.baseDeliveredOrderMatch(restaurant_id) },
    ];

    if (start && end) {
      pipeline.push({
        $match: this.dateRangeMatch(start, end),
      });
    }

    pipeline.push(this.ordersGroup());

    return pipeline;
  }

  // Optional: Combined pipeline that returns both earnings and orders in one query
  buildCombinedEarningsAndOrdersPipeline(
    restaurant_id: string,
    start?: number,
    end?: number,
  ) {
    const match: any = {
      restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
    };

    if (start && end) {
      match.created_at = { $gte: start, $lte: end };
    }

    return [
      { $match: match },
      {
        $facet: {
          earnings: [
            {
              $group: {
                _id: null,
                total: { $sum: '$restaurant_earning' },
              },
            },
          ],
          orders: [
            { $match: { order_status: 'delivered' } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          earning: { $ifNull: [{ $arrayElemAt: ['$earnings.total', 0] }, 0] },
          orders: { $ifNull: [{ $arrayElemAt: ['$orders.count', 0] }, 0] },
        },
      },
    ];
  }
}
