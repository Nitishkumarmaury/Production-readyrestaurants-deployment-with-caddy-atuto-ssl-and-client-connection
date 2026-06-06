import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
@Schema()
export class OrderDriverRequests {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Orders' }) // Add reference to Vehicle schema
  order_id: string;

  @Prop({ type: [String], ref: 'Drivers' })
  driver_ids: string[];

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type OrderDriverRequestsDocument =HydratedDocument<OrderDriverRequests>;
export const OrderDriverRequestsModel = SchemaFactory.createForClass(OrderDriverRequests);
