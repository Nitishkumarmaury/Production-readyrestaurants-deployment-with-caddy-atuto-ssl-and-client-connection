import mongoose from "mongoose";

export class FavouriteAggregation{
    async match(customer_id){
        try {
            return{
                $match:{customer_id:new mongoose.Types.ObjectId(customer_id)}
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
                            $addFields: {
                                is_fav: true
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

    async RatingLookup() {
        try {
            return {
                $lookup: {
                    from: 'reviews',
                    let: { restaurant_id: '$restaurant_id' },
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
                                reviewCount: { $sum: 1 }
                            }
                        }
                    ],
                    as: 'reviewCount'
                }
            };
        } catch (error) {
            throw error;
        }
    }
    

    async UnwindRestaurant(){
        try {
            return{
              $unwind: {
                path: '$restaurant',
                preserveNullAndEmptyArrays: true  // In case there's no corresponding customer
              }
            }
        } catch (error) {
            throw error
        }
    }

    async couponsLookup() {
        try {
            return {
                $lookup: {
                    from: 'coupons',
                    let: { restaurant_id: '$restaurant_id' },
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
                        
                       
                    ],
                    as: 'coupon'
                }
            };
        } catch (error) {
            throw error;
        }
    }

  async categoryLookup() {
    try {
        return {
            $lookup: {
                from: 'food',
                let: { restaurant_id: '$_id' }, // Use '$_id' if restaurant_id refers to the restaurant's _id
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
                            uniqueCategories: { $addToSet: '$category_id' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'uniqueCategories',
                            foreignField: '_id',
                            as: 'categoryDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$categoryDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$categoryDetails'
                        }
                    }
                ],
                as: 'category'
            }
        };
    } catch (error) {
        throw error;
    }
}

async project() {
    return {
        $project: {
            restaurant: 1,
            coupon: 1,
            category: 1 ,
            reviewCount:1// Ensure that 'category' is being included in the projection
        }
    };
}

    
    async face_set(option){
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
          throw error
        }
    }
    

    async GroceryLookup() {
        try {
            return {
                $lookup: {
                    from: 'groceryitems',  // name of grocery collection
                    let: { grocery_item_id: '$grocery_item_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$$grocery_item_id', '$_id']
                                }
                            }
                        },
                        {
                            $addFields: {
                                is_fav: true
                            }
                        }
                    ],
                    as: 'grocery'
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async UnwindGrocery() {
        try {
            return {
                $unwind: {
                    path: '$grocery',
                    preserveNullAndEmptyArrays: true
                }
            };
        } catch (error) {
            throw error;
        }
    }

}