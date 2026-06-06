import { Injectable } from '@nestjs/common';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { UpdateFavouriteDto } from './dto/update-favourite.dto';

import { DbService } from 'src/db/db.service';
import { FavouriteAggregation } from './favourite.aggregation';
import { CommonService } from 'src/common/common.service';
import mongoose from "mongoose";


@Injectable()
export class FavouriteService {
    constructor(
        private readonly model: DbService,
        private readonly favouriteAggregation: FavouriteAggregation,
        private readonly commonService: CommonService
    ) { }

    async create(body, customer_info) {
        try {

            const filter: any = {
                customer_id: customer_info._id,
                restaurant_id: null,
                food_item_id: null,
                grocery_item_id: null,
            };

            // Use whichever ID is provided
            if (body.grocery_item_id && body.restaurant_id) {
                filter.grocery_item_id = body.grocery_item_id;
                filter.restaurant_id = body.restaurant_id;
            }
            if (body.restaurant_id) {
                filter.restaurant_id = body.restaurant_id;
            }
            else if (body.food_item_id) {
                filter.food_item_id = body.food_item_id;
            }


            if(body.food_restaurant_id !== undefined && body.food_restaurant_id !== null && body.food_restaurant_id !== ""){
                filter.food_restaurant_id = body.food_restaurant_id;
            }

            //   else if (body.grocery_item_id)
            //     {
            //        filter.grocery_item_id = body.grocery_item_id;
            //     }

            if (body.status === 'favourite') {
                const add_favourite = await this.model.favourite.findOneAndUpdate(
                    filter,
                    { $set: { customer_id: customer_info._id, ...filter } },
                    { upsert: true, new: true } // return updated doc
                );

                return { data: { ...add_favourite.toObject(), is_fav: true } };
            } else {
                await this.model.favourite.deleteOne(filter);

                const key = 'updated';
                const localization = await this.commonService.localization(key);

                return {
                    message: localization[customer_info.preferred_language],
                    is_fav: false,
                };
            }
        } catch (error) {
            throw error;
        }
    }

    async findAll(customer_id, page, limit, filter: any) {
        try {
            let query: any = { customer_id };

            let { order_type } = filter

            // Apply filter if provided
            if (filter?.type === 'restaurant') {
                query.restaurant_id = { $ne: null };
                query.food_item_id = null;
                query.grocery_item_id = null;

            } else if (filter?.type === 'food_item') {
                query.food_item_id = { $ne: null };
            }
            else if (filter?.type === 'grocery_item') {
                query.grocery_item_id = { $ne: null };
               
            }

            let fav = await this.model.favourite.find(query);
            let results = [];

            for (const favItem of fav) {
                if (filter?.type !== 'grocery_item' && favItem.restaurant_id) {
                    const restaurant = await this.model.restaurant.findOne({ _id: favItem.restaurant_id });
                    if (!restaurant) continue; // skip if deleted restaurant

                    let check_category = await this.model.food
                        .find({ restaurant_id: favItem.restaurant_id }, { category_id: 1 })
                        .populate([{ path: 'category_id' }]);

                    let uniqueCategories = Array.from(new Set(check_category.map((food) => food.category_id)));
                    let category = await this.model.category.find({ _id: { $in: uniqueCategories } });
                    const rating_count = await this.model.review.countDocuments({ restaurant_id: favItem.restaurant_id });

                    results.push({
                        ...restaurant.toObject(),
                        food_restaurant_id: favItem.food_restaurant_id || null, 
                        category,
                        rating_count,
                        is_fav: true
                    });
                } if (filter?.type !== 'restaurant' && favItem.food_item_id) {
                    const food = await this.model.food.findOne({ _id: favItem.food_item_id }).populate('category_id');
                    if (!food) continue; // skip if deleted food

                    results.push({
                        ...food.toObject(),

                        food_restaurant_id: favItem.food_restaurant_id || null, 
                        is_fav: true
                    });
                }
                if (filter?.type !== 'restaurant' && favItem.grocery_item_id) {
                    const grocery = await this.model.GroceryItems.findOne({_id : favItem.grocery_item_id, type : order_type} );
                    if (!grocery) continue;

                    results.push({
                        ...grocery.toObject(),
                        restaurant_id: favItem.restaurant_id,// remove this line if not needed by front end
                        food_restaurant_id: favItem.food_restaurant_id || null, 

                        is_fav: true
                    });

                }
                // Remove else if here for checking add again if this not work......

            }

            // Pagination
            let paginated = results;
            if (page && limit) {
                const skip = (page - 1) * limit;
                paginated = results.slice(skip, skip + limit);
            }

            return { count: results.length, data: paginated };
        } catch (error) {
            throw error;
        }
    }

}
