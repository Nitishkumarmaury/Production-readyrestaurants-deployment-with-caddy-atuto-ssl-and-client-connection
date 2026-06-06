import mongoose from "mongoose";
export class DriverAggregation {

  async _drivermatch() {
    try {
      return {
        $match: { is_active: true, is_approved: true, is_deleted: false, is_block: false },
      };
    } catch (error) {

    }
  }

  async InActiveDriverMatch() {
    try {
      return {
        $match: { is_active: false, is_approved: false, is_deleted: false, is_block: false },
      };
    } catch (error) {

    }
  }

  async Blockdrivermatch() {
    try {
      return {
        $match: { is_block: true },
      };
    } catch (error) {

    }
  }

  async Deleteddrivermatch() {
    try {
      return {
        $match: { is_deleted: true },
      };
    } catch (error) {
      console.log("error", error);
    }
  }

  async Expireddrivermatch() {
    try {
      return {
        $match: { is_active: true, is_approved: false, is_deleted: false, is_block: false , reject_reason : {  $eq : null} },
      };
    } catch (error) {
      console.log("error", error);

    }
  }


  async Pendingdrivermatch(){
    try {
      return {
        $match: {$or : [
          { is_active: false },
          { is_email_verify: false },
          { is_phone_verify: false },
          { set_up_profile: false },
          { is_approved: false },
          { is_docs_update: false },
        ]},
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
        foreignField: 'driver_id',
        as: 'order'
      },
    }
  }

  async AddField() {
    return {
      $addFields: {
        orderCount: { $size: '$order' }
      }
    }
  }


  async fillter_data(search: any) {
    try {

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


  async face_set(option) {
    try {
      return {
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
              $skip: option.skip
            },
            {
              $limit: option.limit
            }
          ]
        }
      }
    } catch (error) {

    }
  }

  async projectFields() {
    return {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        country_code: 1,
        phone: 1,
        is_active: 1,
        is_block: 1,
        is_deleted: 1,
        is_approved: 1,
        orderCount: 1,
        delete_reason: 1,
        ratings: 1
      }
    };
  }


  async match(id: string) {
    try {
      return {
        $match: { _id: new mongoose.Types.ObjectId(id) }

      };
    } catch (error) {
      throw error;
    }
  }


  async DriverBankLookup() {
    try {
      return {
        $lookup: {
          from: 'banks', // Replace with your actual vehicle details collection
          let: { driver_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$driver_id', '$driver_id'] }
                    // { $eq: ['$status', 'active'] }, 
                  ],
                },
              },
            },
            {
              $project: {
                account_number: 1,

              }
            }
          ],
          as: 'bankAccount',
        },
      };
    } catch (error) { }
  }

  async total_payout_lookup() {
    return {
      $lookup: {
        from: 'earnings',
        let: { driverId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$driver_id', '$$driverId'] },
                  { $eq: ['$pay_to_driver', 'complete'] },

                ]
              }
            }
          },
        ],
        as: 'earning'
      }
    };
  }

  async total_payout_AddField() {
    return {
      $addFields: {
        total_payout: {
          $subtract: [
            { $sum: '$earning.delivery_charge' },
            { $sum: '$earning.commission_from_driver' } // Assuming commission is stored in this field
          ]
        }
      }
    };
  }


  async upcoming_payout_lookup() {
    return {
      $lookup: {
        from: 'payments',
        let: { driverId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$driver_id', '$$driverId'] },
                  { $eq: ['$pay_to_driver', 'pending'] },

                ]
              }
            }
          }
        ],
        as: 'Upcoming_payments'
      }
    };
  }


  async upcoming_payout_AddField() {
    return {
      $addFields: {
        upcoming_payout: {
          $subtract: [
            { $sum: '$Upcoming_payments.delivery_charge' },
            { $sum: '$Upcoming_payments.commission_from_driver' } // Assuming commission is stored in this field
          ]
        }
      }
    }
  }

  async DriverVhicalLookup() {
    try {
      return {
        $lookup: {
          from: 'vehicles', // Replace with your actual vehicle details collection
          let: { vehicle_id: '$vehicle_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$vehicle_id'] }
                    // { $eq: ['$status', 'active'] }, 
                  ],
                },
              },
            },
          ],
          as: 'vehical',
        },
      };
    } catch (error) { }
  }

  async UnwindVehicalLookup() {
    try {
      return {
        $unwind: {
          path: "$vehical",
          preserveNullAndEmptyArrays: true
        }
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async driverprojectFields() {
    return {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        phone: 1,
        country_code: 1,
        is_active: 1,
        is_block: 1,
        is_deleted: 1,
        is_approved: 1,
        approved_on: 1,
        created_at: 1,
        licence_front_image: 1,
        licence_back_image: 1,
        licence_expiry_date: 1,
        total_payout: 1,
        upcoming_payout: 1,
        bookingCount: 1,
        doc_update_verification : 1,
        walletbalance: 1,
        // documentsDetails:1,
        vehicleDetails: 1,
        bankAccount: 1,
        block_reason: 1,
        reject_reason: 1,
        docs_approved_on: 1,
        vehical: 1,
        delete_reason: 1,
        delete_description: 1,
        location: 1,
        formatted_address: 1, 


        razor_contact_id: 1,
        razor_fund_account_id: 1,
        bank_account_number : "$bankAccount.account_number"
       
      }
    };

  }

  async _driver_custom_match(match_data) {
    try {
      return {
        $match: {
          ...match_data
        },
      };
    } catch (error) {
      console.log("error", error);
    }
  }

  async _driverRequestmatch() {
    try {
      return {
        $match: { is_approved: null, set_up_profile: true },
        // $match: { is_approved: null, set_up_profile: true,   is_verfication_submitted : true },
      };
    } catch (error) {
      console.log("error", error);
    }
  }

  async _driverUpdateRequestmatch() {
    try {
      return {
        $match: { is_approved: false, is_docs_update: true, set_up_profile: true },
      };
    } catch (error) {
      console.log("error", error);

    }
  }

  async _driverRequestRejectmatch() {
    try {
      return {
        $match: { is_active: true, is_approved: false, set_up_profile: true , reject_reason: { $ne: null } },
      };
    } catch (error) {
      console.log("error", error);

    }
  }

  async driverRequestprojectFields() {
    return {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        country_code: 1,
        phone: 1,
        created_at: 1

      }
    };
  }


  async drivermatch(query) {
    try {
      return {
        $match: query
      }
    } catch (error) {
      throw error
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
        delivery_address: 1,
        cart_items: 1,
        cart_amount: 1,
        delivery_fee: 1,
        free_delivery_fee: 1,
        distance: 1,
        total_amount: 1,
        order_placed_at: 1,
        order_id: 1,
        rider_status: 1,
        order_status: 1,
        tip_amount: 1,
        created_at: 1

      }
    }
  }
  async _driverUpdateRequestmatchStatus(query: any) {
    try {
      return {
        $match: query,
      };
    } catch (error) {
      console.log("error", error);

    }
  }



}

