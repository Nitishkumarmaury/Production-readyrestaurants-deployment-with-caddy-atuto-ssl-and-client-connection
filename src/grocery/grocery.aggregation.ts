import mongoose, { PipelineStage } from 'mongoose';

export class GroceryAggregation {

  categoryLookup() {
    return {
      $lookup: {
        from: 'categories',
        let: { catId: '$category_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$catId'] },
                  { $eq: ['$is_deleted', false] },
                ],
              },
            },
          },
        ],
        as: 'category',
      },
    };
  }

  unwindCategory() {
    return {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: false,
      },
    };
  }

  stockLookup(restaurantId: string) {
    return {
      $lookup: {
        from: 'stocks',
        let: { groceryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$grocery_id', '$$groceryId'] },
                  { $eq: ['$restaurant_id',new mongoose.Types.ObjectId(restaurantId)] }
                ]
              }
            }
          },
          {
            $project : {
              total_stock: 1,              
              color_code: 1, 
              size: 1
            }
          }
        ],
        as: 'stock'
      }
    };
  }

  

  unwindStock() {
    return {
        $unwind: {
            path: '$stock',
            preserveNullAndEmptyArrays: false,
        },
    };
  }

  lookupRestaurant(restaurant_id){
    return {
            $lookup: {
                from: 'restaurants',
                pipeline: [
                    { $match: { _id: new mongoose.Types.ObjectId(restaurant_id) } },
                    {
                        $project: {
                            restaurant_name: 1,
                            restaurant_phone: 1,
                            rating: 1,
                            is_delivery_available: 1,
                            address: {
                                name: 1,
                                area: 1,
                                city: 1,
                                nearby_landmark: 1,
                            },
                        },
                    },
                ],
                as: 'restaurant',
            },
        }
  }


  unwindRestaurant() {
    return {
        $unwind: {
            path: '$restaurant',
            preserveNullAndEmptyArrays: false,
        },
    };
  }

  addStockField() {
    return {
      // $addFields: {
      //   total_stock: {
      //     $ifNull: [{ $arrayElemAt: ['$stock.total_stock', 0] }, 0],
      //   },
      // },


      $addFields: {
        total_stock: {
          $ifNull: [
            { $sum: "$stock.total_stock" },
            0
          ]
        }
      }


    };
  }

  removeStockArray() {
    return {
      $project: {
        stock: 0,
      },
    };
  }

  groupByCategory() {
    return {
      $group: {
        _id: '$category._id',
        category_name: { $first: '$category.category_name' },
        slug: { $first: { $toLower: '$category.category_name' } },
        grocery_items: { $push: '$$ROOT' },
      },
    };
  }

  sliceItems(limit?: number) {
    return {
      $project: {
        _id: 1,
        category_name: 1,
        slug: 1,
        grocery_items: limit
          ? { $slice: ['$grocery_items', limit] }
          : '$grocery_items',
      },
    };
  }


  paginate(page = 1, limit = 10): PipelineStage {
    const skip = (page - 1) * limit;

    return {
      $facet: {
        metadata: [
          { $count: 'total' }
        ],
        data: [
          { $sort: { _id: -1 as 1 | -1 } },
          { $skip: skip },
          { $limit: limit }
        ]
      }
    };
  }

  unwindPagination(): PipelineStage {
    return {
      $project: {
        data: 1,
        total: {
          $ifNull: [{ $arrayElemAt: ['$metadata.total', 0] }, 0]
        }
      }
    };
  }

  searchStage(search?: string) {
    if (!search) return { $match: {} };

    return {
      $match: {
        $or: [
          { 'category.category_name': { $regex: search, $options: 'i' } },
          { 'name': { $regex: search, $options: 'i' } }, 
        ],
      },
    };
  }


  favouriteLookup(customerId: string, restaurant_id : string ) {
    return {
      $lookup: {
        from: 'favourites',
        let: { groceryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$grocery_item_id', '$$groceryId'] },
                  { $eq: ['$restaurant_id', new mongoose.Types.ObjectId(restaurant_id)] },
                  { $eq: ['$customer_id', new mongoose.Types.ObjectId(customerId)] }
                ]
              }
            }
          },
          { $limit: 1 } 
        ],
        as: 'favourite'
      }
    };
  }

  addIsFavField() {
    return {
      $addFields: {
        is_fav: {
          $cond: [
            { $gt: [{ $size: '$favourite' }, 0] },
            true,
            false
          ]
        }
      }
    };
  }

  removeFavouriteArray() {
    return {
      $project: {
        favourite: 0
      }
    };
  }


  async filter(filter){
    try {
      return {
        $match : filter
      }
    }catch (e) {
      throw e
    }
  }


}
