import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import * as mongosse from 'mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class CustomerAddress {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customer' }) // Add reference to Vehicle schema
  customer_id: string;

  @Prop({ default: null })
  name: string;

  @Prop({ default: null })
  building_no: string;

  @Prop({ default: null })
  tower: string;

  @Prop({ default: null })
  area: string;

  @Prop({ default: null })
  city: string;

  @Prop({ default: null })
  nearby_landmark: string;

  @Prop({ default: null })
  lat: string;

  @Prop({ default:null })
  long: string;

  @Prop({ default:null })
  type: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type CustomerAddressDocument = HydratedDocument<CustomerAddress>;
export const CustomerAddressModel = SchemaFactory.createForClass(CustomerAddress);
