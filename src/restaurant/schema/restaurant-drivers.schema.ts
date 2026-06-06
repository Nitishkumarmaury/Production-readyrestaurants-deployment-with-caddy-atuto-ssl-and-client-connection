import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

@Schema({ timestamps: true })
export class RestaurantDrivers {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
  restaurant_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Drivers', default: null })
  driver_id: string;
}

export type RestaurantDriversDocment = HydratedDocument<RestaurantDrivers>;
export const RestaurantDriversModel = SchemaFactory.createForClass(RestaurantDrivers);
