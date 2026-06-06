import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Pricings {

  @Prop({ default: 0 })
  base_fee: number;

  @Prop({ default: 0 })
  distance_per_km: number;

  @Prop({ default: 0 })
  commission_percentage: number;

  @Prop({ default: 0 })
  tax_percentage: number;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type PricingsDocument = HydratedDocument<Pricings>;
export const PricingsModel = SchemaFactory.createForClass(Pricings);
