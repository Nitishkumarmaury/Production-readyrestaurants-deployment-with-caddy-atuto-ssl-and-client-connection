import mongoose from "mongoose";
import { pipe } from "rxjs";
import { pipeline } from "stream";

export class CateringServicesAggregation {

    async categoryListAggregation (){

        let pipeline = [];

        pipeline.push({
            $match : {
                catering_services : true,
            }
            },
            {
            $lookup: {
                    from: 'fooditems',
                    let: { 
                        category_id: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                     { $eq: ["$category_id", "$$category_id"] },
                                    ]
                                },
                                catering_services : true
                            }
                        },
                    ],
                    as: 'food'
                }

            },
            {
                // REMOVE categories with empty food array
                $match: {
                    food: { $ne: [] }
                }
            },
            {
                $project: {
                    category_name: 1,
                    category_image: 1,
                    food: {
                    $map: {
                        input: "$food",
                        as: "f",
                        in: {
                            id: "$$f._id",
                            name: "$$f.name",
                            category_id: "$$f.category_id",
                            image: "$$f.image",
                            

                            
                        }
                    }
                    }
                }
            }
        );
        return pipeline

    }
}