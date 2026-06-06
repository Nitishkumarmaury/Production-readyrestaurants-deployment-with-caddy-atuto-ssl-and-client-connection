export class VendorAggregation {
    async match(query) {
      try {
        return {
          $match: query,
        };
      } catch (error) {
        throw error;
      }
    }

    async driverLookup() {
      try {
          return {
              $lookup: {
                  from: 'drivers',
                  let: { driver_id: '$driver_id' },
                  pipeline: [
                      {
                          $match: {
                              $expr: {
                                 $eq: ['$_id', '$$driver_id'] 
                              }
                          }
                      }
                    
                     
                  ],
                  as: 'driver'
              }
          };
      } catch (error) {
          throw error;
      }
  }

  async  UnwindDriverLookup() {
    try {
        return {
            $unwind:{
                path:"$driver",
                preserveNullAndEmptyArrays:true
            }
        }            
    } catch (error) {
        console.log("error", error);
        throw error;
    }
}

    async project() {
      try {
        return {
          $project: {
            order_id: 1,
            cart_items: 1,
            created_at: 1,
          },
        };
      } catch (error) {
        console.log('error', error);
      }
    }
  
    async set_data() {
      try {
        return{
            $set:{
              driver: { $ifNull: ["$driver", null] } 
            }
        }
      } catch (error) {
        throw error
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
                  total_earning: { $sum: '$cart_amount' },
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
                  order_placed_at: -1 as 1 | -1,
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
      } catch (error) {}
    }
  }
  