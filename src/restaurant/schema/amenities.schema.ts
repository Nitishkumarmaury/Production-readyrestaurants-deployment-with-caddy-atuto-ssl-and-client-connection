import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

@Schema({ timestamps: true })
export class Amenities {

  @Prop({ type: String, default: null })
  name: string;
}

export type AmenitiesDocment = HydratedDocument<Amenities>;
export const AmenitiesModel = SchemaFactory.createForClass(Amenities);

