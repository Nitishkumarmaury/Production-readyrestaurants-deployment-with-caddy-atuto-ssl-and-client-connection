import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import * as mongosse from 'mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Vehicles {
  
  @Prop({ default: null })
  name: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type VehiclesDocument = HydratedDocument<Vehicles>;
export const VehiclesModel = SchemaFactory.createForClass(Vehicles);
