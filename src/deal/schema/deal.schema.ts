import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';
import {  Types } from 'mongoose';
import { FoodItems } from 'src/food/schema/food-item.schema';
import * as mongoose from 'mongoose';



export enum DealStatus {
   Active = "active",
   NotActive = "not_active"
}

@Schema({ _id: false })
export class DealItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FoodItems", required: true })
  food_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  quantity: number;
}
export const DealItemSchema = SchemaFactory.createForClass(DealItem);



@Schema({ timestamps: true })
export class Deals {
  @Prop({ type: String, default: null })
  title: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: Number, default: 0 })
  price: number;
  

  @Prop({ type: [DealItemSchema], default: [] })
  items: DealItem[];

  @Prop({ type: [mongosse.Schema.Types.ObjectId], ref: 'Restaurant', default: [] }) 
  not_available_restaurant_ids: string[];

}

export type DealsDocment = HydratedDocument<Deals>;
export const DealsModel = SchemaFactory.createForClass(Deals);
