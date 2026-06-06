import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import * as dto from './dto/index.dto';
import { Types } from 'mongoose';


@Injectable()
export class QuickPicksService {
    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
    ) { }

    add_restro_quick_picks = async (req: any, body: dto.quick_picks.pick_restro) => {
        try {
            const { user_id } = req.payload;
            const { restaurant_ids } = body;

            if (!restaurant_ids || restaurant_ids.length === 0) {
                return { data: [], message: "No restaurant IDs provided" };
            }

            const restaurantObjectIds = restaurant_ids.map((id: string) => new Types.ObjectId(id));

            const existingRestaurants = await this.model.quickpicks.find(
                { restaurant: { $in: restaurantObjectIds } },
                { restaurant: 1 }
            ).lean();

            const existingIds = new Set(existingRestaurants.map(r => String(r.restaurant)));

            const newRestaurants = restaurantObjectIds
                .filter(id => !existingIds.has(String(id)))
                .map(id => ({
                    restaurant: id,
                    created_by: user_id
                }));

            if (newRestaurants.length > 0) {
                await this.model.quickpicks.insertMany(newRestaurants);
            }

            return { data: newRestaurants };

        } catch (error) {
            throw error;
        }
    }

    get_quick_picks_admin = async (body: dto.quick_picks.pick_restro_list) => {
        try {
            const { page, limit } = body;
            const options = await this.commonService.set_options(page, limit);
            let query = {};

            const quick_picks_restro = await this.model.quickpicks.find({}, { restaurant: true}, {lean: true});
            const restaurant_ids = new Set(quick_picks_restro.map(r => r.restaurant));

            const restaurants = await this.model.restaurant.find(
                {
                    _id: { $in: restaurant_ids }
                },
                {},
                options
            )
            return restaurants
        } catch (error) {
            throw error;
        }
    }
}
