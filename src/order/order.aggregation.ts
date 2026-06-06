import mongoose from "mongoose";
import { platform } from "os";
export class OrderAggregation {


    async match(order_id) {
        try {
            return {
                $match: { _id: new mongoose.Types.ObjectId(order_id) }
            }
        } catch (error) {
            throw error
        }
    }

    async CustomerLookup() {
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

                    ],
                    as: 'customer'
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async DriverLookup() {
        try {
            return {
                $lookup: {
                    from: 'drivers',
                    let: { driver_id: '$driver_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$$driver_id', '$_id'] }
                                    ]
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

    async AddOnLookup() {
        try {
            return {
                $lookup: {
                    from: 'fooditems.add_ons',
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
                        }, {
                            $project: {
                                name: 1
                            }
                        }


                    ],
                    as: 'customer'
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
                    let: { order_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$$order_id', '$order_id'] }
                                    ]
                                }
                            }
                        },


                    ],
                    as: 'review'
                }
            };
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
                        }


                    ],
                    as: 'restaurant'
                }
            };
        } catch (error) {
            throw error;
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

    async UnwindDriverLookup() {
        try {
            return {
                $unwind: {
                    path: "$driver",
                    preserveNullAndEmptyArrays: true
                }
            }
        } catch (error) {
            console.log("error", error);
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

    async UnwindReviewLookup() {
        try {
            return {
                $unwind: {
                    path: "$review",
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
                customer: 1,
                driver: 1,
                restaurant: 1,
                order_id: 1,
                cart_items: 1,
                grocery_cart_items: 1,
                delivery_address: 1,
                note_for_restaurant: 1,
                review: 1,
                order_status: 1,
                order_type: 1,
                rider_status: 1,
                order_placed_at: 1,
                order_confirmed_at: 1,
                add_receiver_detail: 1,
                order_prepared_at: 1,
                order_ready_at: 1,
                order_picked_up_at: 1,
                order_delivered_at: 1,
                more_time_required_at: 1,
                add_more_time: 1,
                cart_amount: 1,
                coupon_amount: 1,
                platform_fee: 1,
                delivery_fee: 1,
                free_delivery_fee: 1,
                tax_amount: 1,
                total_amount: 1,
                driver_rating: 1,
                restaurant_rating: 1,
                add_delivery_instruction: 1,
                payment_status: 1,
                refund_at: 1,
                distance: 1,
                created_at: 1,
                updated_at: 1,
                scheduled_time: 1,
                tip_amount: 1,
                delivery_otp: 1,
                otp_sent_at: 1,
                deliver_type: 1,
                refund_liability : 1,
                refund_reason : 1, 
                is_fixed_time_delivery: 1,
                fixed_time_delivery: 1,
                table_no : 1,
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