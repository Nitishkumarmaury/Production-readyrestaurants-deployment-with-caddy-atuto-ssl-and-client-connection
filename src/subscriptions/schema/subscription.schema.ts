import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

@Schema({ timestamps: true })
export class SubscriptionItems {

    @Prop({ type: String, default: null })
    title: string;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: Number, default: 0 })
    price: number;

    @Prop({ type: String, default: null })
    image: string;

    @Prop({ type: [mongosse.Schema.Types.ObjectId], ref: 'Restaurant', default: [] }) 
    not_available_restaurant_ids: string[];
}

export type SubscriptionItemsDocment = HydratedDocument<SubscriptionItems>;
export const SubscriptionItemsModel = SchemaFactory.createForClass(SubscriptionItems);

