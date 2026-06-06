import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
@Schema({ timestamps: true })
export class Reports {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Bookings' }) // Add reference to Vehicle schema
  restaurant_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Orders' }) // Add reference to Vehicle schema
  order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId }) // Add reference to Vehicle schema
  user_id: string;

  @Prop({ default: null })
  image: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  reply: string;

  @Prop({ default: null })
  status: string;

  @Prop({ default: null })
  reply_at: number;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'ReportReason', default: null })
  report_reason_id: string;

}

export type ReportsDocument = HydratedDocument<Reports>;
export const ReportsModel = SchemaFactory.createForClass(Reports);
