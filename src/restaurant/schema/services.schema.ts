import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

@Schema({ timestamps: true })
export class Services {

  @Prop({ type: String, default: null })
  name: string;


  @Prop({ type: String, default: null })
  image: string;
}

export type ServicesDocment = HydratedDocument<Services>;
export const ServicesModel = SchemaFactory.createForClass(Services);

