import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ReviewAggregation } from './review.aggregation';
import { CommonService } from 'src/common/common.service';
import mongoose, { Types } from 'mongoose';

import { PipelineStage } from 'mongoose';

@Injectable()
export class ReviewService {
    constructor(private readonly model: DbService, private readonly reviewAggregation: ReviewAggregation, private readonly commonService: CommonService) { }
    async RateRestaurant(body, payload) {
        try {
            let data
            let rated_by
            if (payload.scope === 'customer') {
                let customer_id = payload.user_id
                rated_by = "customer"
                data = { ...body, customer_id, rated_by }
            } else if (payload.scope === 'driver') {
                let driver_id = payload.user_id
                rated_by = "driver"
                data = { ...body, driver_id, rated_by }
            }
            const create = await this.model.review.create(data)
            await this.model.order.updateOne({ _id: body.order_id }, { restaurant_rating: body.rating })
            await this.UpdateRestaurantRating(body)
            if (body.food_items) {
                console.log("if food come......................");

                await this.UpdateFoodRating(body)
            }
            return { data: create }
        } catch (error) {
            throw error;
        }
    }

    async rateDriver(body, payload) {
        try {
            let data
            let rated_by

            let customer_id = payload.user_id
            rated_by = "customer"
            data = { ...body, customer_id, rated_by }

            const create = await this.model.review.create(data)
            await this.model.order.updateOne({ _id: body.order_id }, { driver_rating: body.rating })
            await this.UpdateDriverRating(body)
            return { data: create }
        } catch (error) {
            throw error;
        }
    }

    async rateCustomer(body, payload) {
        try {
            let data;
            let rated_by;

            // only driver can rate customer
            if (payload.scope === 'driver') {
                let driver_id = payload.user_id;
                rated_by = "driver";
                data = { ...body, driver_id, rated_by };
            } else {
                throw new Error("Only driver can rate customer");
            }

            const create = await this.model.review.create(data);

            // update order with customer rating
            await this.model.order.updateOne(
                { _id: body.order_id },
                { rating: body.rating }
            );

            // update customer's average rating
            await this.UpdateCustomerRating(body);

            return { data: create };
        } catch (error) {
            throw error;
        }
    }

    async UpdateCustomerRating(body) {
        const ratings = await this.model.review.aggregate([
            { $match: { customer_id: new mongoose.Types.ObjectId(body.customer_id), rating: { $ne: null } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);

        if (ratings.length > 0) {
            await this.model.customer.updateOne(
                { _id: body.customer_id },
                { ratings: ratings[0].avgRating }
            );
        }
    }




    async UpdateRestaurantRating(body) {
        try {
            let totalNoOfRating = 0
            let totalRating = 0
            const allReview = await this.model.review.find({ restaurant_id: body.restaurant_id }, { rating: 1 })
            console.log("allreview", allReview);

            for (const rate of allReview) {
                totalRating += rate.rating
                totalNoOfRating += 1
            }
            // Calculate the overall rating
            console.log("allreview", totalRating);
            console.log("allreview", totalNoOfRating);
            let overallRating = 0;
            if (totalNoOfRating > 0) {
                overallRating = parseFloat((totalRating / totalNoOfRating).toFixed(1));
            }

            // Optionally update the restaurant with the new rating
            if (!isNaN(overallRating)) {
                await this.model.restaurant.updateOne(
                    { _id: body.restaurant_id },
                    { rating: overallRating }
                );
            }
        } catch (error) {
            throw error
        }
    }

    async UpdateDriverRating(body) {
        try {
            let totalNoOfRating = 0
            let totalRating = 0
            const allReview = await this.model.review.find({ driver_id: body.driver_id }, { rating: 1 })

            for (const rate of allReview) {
                totalRating += rate.rating
                totalNoOfRating += 1
            }
            // Calculate the overall rating
            let overallRating = 0;
            if (totalNoOfRating > 0) {
                overallRating = parseFloat((totalRating / totalNoOfRating).toFixed(1));
            }

            // Optionally update the restaurant with the new rating
            if (!isNaN(overallRating)) {
                await this.model.driver.updateOne(
                    { _id: body.driver_id },
                    { ratings: overallRating }
                );
            }
        } catch (error) {
            throw error
        }
    }



    async UpdateFoodRating(body) {
        try {
            // Iterate over each food item in the provided body
            for (const foodItem of body.food_items) {
                let totalNoOfRating = 0;
                let totalRating = 0;

                // Fetch all reviews that include the specific food item
                const allReview = await this.model.review.find(
                    { "food_items.food_id": foodItem.food_id },
                    { food_items: 1 }
                );

                console.log("allReview for food item:", foodItem.food_id, allReview);

                // Iterate through each review
                for (const review of allReview) {
                    // Iterate through food_items in each review to find the matching food_id
                    for (const item of review.food_items) {
                        if (item.food_id.toString() === foodItem.food_id.toString()) {
                            totalRating += item.rate;
                            totalNoOfRating += 1;
                        }
                    }
                }

                // Calculate the overall rating
                let overallRating = 0;
                if (totalNoOfRating > 0) {
                    overallRating = parseFloat((totalRating / totalNoOfRating).toFixed(1));
                }

                // Update the food item's rating in the food document
                if (!isNaN(overallRating)) {
                    await this.model.food.updateOne(
                        { _id: foodItem.food_id },
                        { $set: { rating: overallRating } }
                    );
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async RestaurantReview(restaurant_id, page, limit) {
        try {
            let options = await this.commonService.set_options(page, limit);
            let data_to_aggregate = [
                await this.reviewAggregation.match(restaurant_id),
                await this.reviewAggregation.customer_lookup(),
                await this.reviewAggregation.UnwindCustomerLookup(),
                await this.reviewAggregation.project(),
                await this.reviewAggregation.face_set(options)
            ]
            const restaurant = await this.model.restaurant.findOne({ _id: restaurant_id }, { restaurant_name: 1, rating: 1 })
            const data = await this.model.review.aggregate(data_to_aggregate)
            return { restaurant_name: restaurant.restaurant_name, overall_rating: restaurant.rating, count: data[0]?.count[0]?.count, data: data[0]?.data }
        } catch (error) {
            console.log("error", error);
            throw error
        }
    }

    async driverReview(driver_id, page, limit) {
        try {
            let options = await this.commonService.set_options(page, limit);
            let data_to_aggregate = [
                await this.reviewAggregation.driverMatch(driver_id),
                await this.reviewAggregation.customer_lookup(),
                await this.reviewAggregation.UnwindCustomerLookup(),
                await this.reviewAggregation.project(),
                await this.reviewAggregation.face_set(options)
            ]
            const driver = await this.model.driver.findOne({ _id: driver_id }, { name: 1, ratings: 1 })
            const data = await this.model.review.aggregate(data_to_aggregate)
            return { driver_name: driver.name, overall_rating: driver.ratings, count: data[0]?.count[0]?.count, data: data[0]?.data }
        } catch (error) {
            throw error
        }
    }

    async customerReview(customer_id: string, page: number, limit: number) {
        try {
            let options = await this.commonService.set_options(page, limit);

            let data_to_aggregate = [
                await this.reviewAggregation.customerMatch(customer_id),
                await this.reviewAggregation.driver_lookup(),   // join driver info
                await this.reviewAggregation.UnwindDriverLookup(),
                await this.reviewAggregation.project(),
                await this.reviewAggregation.face_set(options)
            ];

            const customer = await this.model.customer.findOne(
                { _id: customer_id },
                { name: 1, ratings: 1 }
            );

            const data = await this.model.review.aggregate(data_to_aggregate);

            return {
                customer_name: customer.name,
                overall_rating: customer.ratings,
                count: data[0]?.count[0]?.count || 0,
                data: data[0]?.data || [],
            };
        } catch (error) {
            throw error;
        }
    }


    async vendorReviewListing(payload, page = 1, limit = 10) {
        try {
            const vendor_id = payload.user_id;
            const options = await this.commonService.set_options(page, limit);

            // Fetch restaurant for the vendor
            const restaurant = await this.model.restaurant
                .findOne({ vendor_id: vendor_id }, { _id: 1, restaurant_name: 1, rating: 1 })
                .lean();

            if (!restaurant) throw new Error('Restaurant not found');

            const pipeline: PipelineStage[] = [
                {
                    $match: {
                        restaurant_id: new Types.ObjectId(restaurant._id),
                    },
                },
                {
                    $sort: { created_at: -1 },
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order_id',
                        foreignField: '_id',
                        as: 'order_info',
                    },
                },
                {
                    $unwind: {
                        path: '$order_info',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'customer_info',
                    },
                },
                {
                    $unwind: {
                        path: '$customer_info',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $facet: {
                        data: [
                            { $skip: options.skip },
                            { $limit: options.limit },
                            {
                                $project: {
                                    rating: 1,
                                    description: 1,
                                    image: 1,
                                    created_at: 1,
                                    order_id: '$order_info.order_id',
                                    customer_name: '$customer_info.name',

                                },
                            },
                        ],
                        count: [{ $count: 'count' }],
                    },
                },
            ];

            const [result] = await this.model.review.aggregate(pipeline);

            // Fetch vendor name
            const vendor = await this.model.vendor
                .findOne({ _id: vendor_id }, { name: 1 })
                .lean();

            return {
                vendor_name: vendor?.name || '',
                restaurant_id: restaurant?._id || null,
                restaurant_name: restaurant?.restaurant_name || '',
                overall_rating: restaurant?.rating || 0,
                count: result?.count?.[0]?.count || 0,
                data: result?.data || [],
            };
        } catch (error) {
            throw error;
        }
    }

}
