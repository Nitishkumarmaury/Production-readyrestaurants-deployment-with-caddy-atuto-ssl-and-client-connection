export class EarningsAggregation {
  async match(query) {
    try {
      return {
        $match: query,
      };
    } catch (error) {
      throw error;
    }
  }
  async orderLookup() {
    try {
      return {
        $lookup: {
          from: 'orders',
          let: { order_id: '$order_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$order_id'] },
                    { $eq: ["$order_status", "delivered"] }
                  ],
                },
              },
            },
            {
              $project: {
                order_id: 1,
                order_placed_at: 1,
                order_status: 1,
                payment_status: 1,
                delivery_address: 1,
                order_type: 1,
                delivery_fee: 1,
                platform_fee: 1,
                tax_amount: 1,
                total_amount: 1,
                tip_amount: 1,
                deliver_type: 1,
                distance:1,
                cart_amount:1,
                cart_items:1,
                add_receiver_detail:1

              },
            },
          ],
          as: 'order',
        },
      };
    } catch (error) {
      throw error;
    }
  }






  async orderUnwind() {
    try {
      return {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
        }
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async deliverOrderMatch() {
    try {
      return {
        $match: {
          'order.order_status': 'delivered',
          'order.payment_status': { $in: ['complete', 'pending'] }
        }
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


   async driverOrderLookup() {
    try {
      return {
        $lookup: {
          from: 'driverorders',
          let: { driver_order_id: '$driver_order_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$driver_order_id'] },
                  ],
                },
              },
            },

            // {
            //   $project: {




            //     // order_id: 1,
            //     // order_placed_at: 1,
            //     // order_status: 1,
            //     // payment_status: 1,
            //     // delivery_address: 1,
            //     // order_type: 1,
            //     // delivery_fee: 1,
            //     // platform_fee: 1,
            //     // tax_amount: 1,
            //     // total_amount: 1,
            //     // tip_amount: 1,
            //     // deliver_type: 1,
            //     // distance:1,
            //     // cart_amount:1,
            //     // cart_items:1,
            //     // add_receiver_detail:1


            //   },
            // },
          ],
          as: 'driverorders',
        },
      };
    } catch (error) {
      throw error;
    }
  }




  async driverOrderUnwind() {
    try {
      return {
        $unwind: {
          path: '$driverorders',
          preserveNullAndEmptyArrays: false
        }
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


    async DriverOrderEarningface_set(skip, limit) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],

          total_earning: [
            {
              $group: {
                _id: null,
                total_earning: {
                  $sum: {
                    $add: ["$total_amount"]
                  }
                }
              }
            },
            {
              $project: {
                total_earning: { $round: ["$total_earning", 2] }
              }
            }
          ],


          data: [
            {
              $sort: {
                _id: -1 as 1 | -1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
        },
      };
    } catch (error) { }
  }


  async project() {
    try {
      return {
        $project: {
          order: 1,
          order_placed_at: "$order.order_placed_at",
          restaurant_earning: {
            $round: ["$restaurant_earning", 2],
          },
          created_at: 1,
        order_id: "$order.order_id",
        payment_status: "$order.payment_status",
        order_type: "$order.order_type",
        deliver_type: "$order.deliver_type",

        delivery_address: "$order.delivery_address",
        add_receiver_detail: "$order.add_receiver_detail",

        delivery_fee: "$order.delivery_fee",
        platform_fee: "$order.platform_fee",
        tax_amount: "$order.tax_amount",
        total_amount: "$order.total_amount",
        tip_amount: "$order.tip_amount",
        cart_amount: "$order.cart_amount",

        distance: "$order.distance",
        cart_items: "$order.cart_items"
        },
      };
    } catch (error) {
      console.log('error', error);
    }
  }

  async face_set(skip, limit) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],

          total_earning: [
            {
              $group: {
                _id: null,
                total_earning: { $sum: '$restaurant_earning' },
              },
            },
            {
              $project: {
                total_earning: { $round: ['$total_earning', 2] },
              },
            },
          ],

          data: [
            {
              $sort: {
                order_placed_at: -1 as -1 | -1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
        },
      };
    } catch (error) { }
  }

  async EarningMatch(query) {
    try {
      return {
        $match: query
      }
    } catch (error) {
      console.log("error", error);
      throw error

    }
  }

  async earningProject() {
    try {
      return {
        $project: {
          order_id: 1,
          reference_id : 1,
          delivery_charge: 1,
          food_amount: 1,
          coupon_amount : 1,
          tax: 1,
          total_amount: 1,
          commission_from_driver: 1,
          commission_from_restaurant: 1,
          created_at: 1,
          createdAt: 1,
          earning_type : 1,
        }
      }
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async Earningface_set(skip, limit) {
    try {
      return {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],

          total_earning: [
            {
              $group: {
                _id: null,
                // total_earning: {
                //   $sum: {
                //     $add: ["$commission_from_restaurant", "$commission_from_driver"]

                //     coupon_amount: "$coupon_amount"

                //   }
                // }

                total_earning: {
                  $sum: {
                    $subtract: [
                      {
                        $add: [
                          { $ifNull: ["$commission_from_restaurant", 0] },
                          { $ifNull: ["$commission_from_driver", 0] }
                        ]
                      },
                      { $ifNull: ["$coupon_amount", 0] }
                    ]
                  }
                }
              }
            },
            {
              $project: {
                total_earning: { $round: ["$total_earning", 2] }
              }
            }
          ],

          data: [
            {
              $sort: {
                _id: -1 as 1 | -1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
        },
      };
    } catch (error) { }
  }


  async DateFilterMatch(start_date, end_date) {
    try {
      console.log("d", start_date);
      console.log("d", end_date);
      return {
        $match: {
          created_at: {
            $gte: start_date,
            $lte: end_date
          }
        }
      }

    } catch (error) {
      console.log("error", error);

    }
  }


  async bookingIdLoopup() {
    return {
      $lookup: {
        from: 'orders',
        let: { order_id: '$order_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$order_id'] }

                ]
              }
            }
          },
          {
            $project: {
              order_id: 1,


            }
          }
        ],
        as: 'order'
      }
    };
  }



  async export_project() {
    return {
      $project: {
        delivery_charge: 1,
        food_amount: 1,
        commission_from_restaurant: 1,
        commission_from_driver: 1,
        tax: 1,
        total_amount: 1,
        created_at: 1,
        order: 1,
        // totalEarned:1
      }
    }
  }

}
