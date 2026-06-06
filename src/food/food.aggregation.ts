import mongoose from "mongoose";

export class FoodAggregation {
    async match(food_id) {
        try {
            return {
                $match: { _id: new mongoose.Types.ObjectId(food_id) }
            }
        } catch (error) {
            throw error
        }
    }



    // async MakeYourOwnLookup() {
    //     try {
    //         return {
    //             $lookup: {
    //                 from: 'makeyourownitems',
    //                 let: { food_id: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $eq: ['$$food_id', '$food_id']
    //                             }
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: 'customizationgroups',
    //                             let: { group_id: '$group_id' },
    //                             pipeline: [
    //                                 {
    //                                     $match: {
    //                                         $expr: {
    //                                             $eq: ['$$group_id', '$_id']
    //                                         }
    //                                     }
    //                                 },
    //                                 {
    //                                     $project: {
    //                                         _id: 1,             // Keep the group ID
    //                                         group_title: 1,           // Include the title
    //                                         group_description: 1      // Include the description
    //                                     }
    //                                 }
    //                             ],
    //                             as: 'group_id'
    //                         }

    //                     },
    //                     {
    //                         $unwind: {
    //                             path: "$group_id",
    //                             preserveNullAndEmptyArrays: true
    //                         }
    //                     },
    //                     {
    //                         $project: {
    //                             _id:1,
    //                             group_id:1,
    //                             title: 1,           // Include the title
    //                             customer_selection: 1,    // Include the description
    //                             additional_price: 1,             // Keep the group ID
    //                         }
    //                     }
    //                 ],
    //                 as: 'make_your_own'
    //             }
    //         };
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async MergeData() {
    //     try {
    //         return { $addFields: { customization: { $mergeObjects: ["$customization", { make_your_own: "$make_your_own" }] } } }
    //     } catch (error) {
    //         throw error
    //     }
    // }

    async MakeYourOwnLookup() {
        try {
            return {
                $lookup: {
                    from: 'customizationgroups',  // The collection to lookup from
                    let: { group_id: '$make_your_own.group_id' },  // Reference the group_id from the `make_your_own` field
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$group_id']  // Match the group_id with the _id in the `customizationgroups`
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,                // Keep the _id (group ID)
                                group_title: 1,        // Include the title of the group
                                group_description: 1   // Include the description of the group
                            }
                        }
                    ],
                    as: 'group_idlocal'  // Populate `make_your_own.group_details` with the lookup result
                }
            };
        } catch (error) {
            throw error;
        }
    }
    

    async project() {
        return {
            $project: {
                restaurant_id: 1,
                category_id: 1,
                food_type: 1,
                image: 1,
                name: 1,
                price: 1,
                rating: 1,
                extimate_time: 1,
                description: 1,
                pieces: 1,
                quantity: 1,
                size: 1,
                add_ons: 1,
                toppings: 1,
                make_your_own:1,
                item_timing: 1
            }
        }
    }
    
    
    

}