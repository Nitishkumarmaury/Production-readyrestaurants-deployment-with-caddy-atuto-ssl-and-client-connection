import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { FoodItems } from 'src/food/schema/food-item.schema';

@Schema()
export class Favourites {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurants', required: false })
    restaurant_id: string;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: FoodItems.name, required: false })
    food_item_id: string;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: false })
    customer_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GroceryItems', required: false })
    grocery_item_id: string;


    @Prop({ type: Number, default: moment.utc().valueOf() })
    created_at: number;
    @Prop({ type: Number, default: null })
    updated_at: number;


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurants', required: false })
    food_restaurant_id: string;

}


export type FavouritesDocument = HydratedDocument<Favourites>;
export const FavouritesModel = SchemaFactory.createForClass(Favourites);
