import mongoose, { Types } from 'mongoose';

export class SubscriptionAggregation {

    async projectWithPagination(limit, page) {
        try {
            page = Number(page) || 1;
            limit = Number(limit) || 10;
            return {
                $facet: {
                    total: [
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
                            $project: {
                                _id: 1,
                                title: 1,
                                description: 1,
                                price: 1,
                                image: 1,
                                createdAt: 1,
                                isActive: 1
                            }
                        },
                        {
                            $skip: (page - 1) * limit
                        },
                        {
                            $limit: parseInt(limit)
                        },
                    ]
                }
            }
        } catch (error) {
            throw error
        }
    }


    async checkStatus(restaurant_id) {
        try {
            return {
                $addFields: {
                    isActive: {
                        $cond: {
                            if: {
                                $in: [
                                    new Types.ObjectId(restaurant_id),
                                    { $ifNull: ["$not_available_restaurant_ids", []] }
                                ]
                            }, // check id is in array
                            then: false,
                            else: true
                        }

                    }
                }
            }


        } catch (error) {
            throw error
        }
    }

    async onlyActive() {
        try {
            return {
                $match: {
                    isActive: true
                }
            }
        } catch (error) {
            throw error
        }

    }
}