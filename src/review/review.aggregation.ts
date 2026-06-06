import mongoose from "mongoose";

export class ReviewAggregation {

    async customerMatch(customer_id: string) {
        return { $match: { 
            customer_id: new mongoose.Types.ObjectId(customer_id),
            rated_by:'driver'
         } };
    }

    async driver_lookup() {
        return {
            $lookup: {
                from: 'drivers',
                localField: 'driver_id',
                foreignField: '_id',
                as: 'driver',
            },
        };
    }

    async UnwindDriverLookup() {
        return { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } };
    }
    async match(restaurant_id) {
        try {
            return {
                $match: { restaurant_id: new mongoose.Types.ObjectId(restaurant_id), rated_by: "customer" }
            }
        } catch (error) {
            throw error
        }
    }

    async driverMatch(driver_id) {
        try {
            return {
                $match: { driver_id: new mongoose.Types.ObjectId(driver_id), rated_by: "customer" }
            }
        } catch (error) {
            throw error
        }
    }

    async customer_lookup() {
        try {
            return {
                $lookup: {
                    from: 'customers',
                    let: { customer_id: '$customer_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$$customer_id', '$_id'] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1
                            }
                        }
                    ],
                    as: 'customer'
                }
            };
        } catch (error) {
            throw error
        }
    }

    async UnwindCustomerLookup() {
        try {
            return {
                $unwind: {
                    path: "$customer",
                    preserveNullAndEmptyArrays: true
                }
            }
        } catch (error) {
            console.log("error", error);
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
                                _id: 1,
                                restaurant_name: 1,
                                rating: 1
                            }
                        }
                    ],
                    as: 'restaurant'
                }
            };
        } catch (error) {
            throw error
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
                description: 1,
                rating: 1,
                driver: 1,
                customer: 1,
                image: 1,
                created_at: 1

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
}