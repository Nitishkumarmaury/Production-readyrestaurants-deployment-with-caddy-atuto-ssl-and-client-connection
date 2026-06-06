import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';

@Schema({
    timestamps: { 
      createdAt: 'created_at', 
      updatedAt: 'updated_at'
    }
})
export class Reviews {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Orders', required: true })
    order_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurants', required: false })
    restaurant_id: string;

    @Prop([{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItems', required: true },
        rate: { type: Number, required: true }
    }])
    food_items: { food_id: string; rate: number }[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: false })
    customer_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: false })
    driver_id: string;

    @Prop({ type: String, default: null })
    rated_by: string;

    @Prop({ type: Number, default: null })
    rating: number;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: String, default: null })
    image: string;

    // @Prop({ type: Number, default: moment.utc().valueOf() })
    // created_at: number;

    // @Prop({ type: Number, default: null })
    // updated_at: number;
}

export type ReviewsDocument = HydratedDocument<Reviews>;
export const ReviewsModel = SchemaFactory.createForClass(Reviews);
