import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

@Schema({ timestamps: true })
export class CustomerReferralOrder {

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Customers", required : false, default : null })
  parent_customer_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Customers", required : false, default : null })
  child_customer_id: string;

  @Prop({ type: Number, default: 0 })
  order_count: number;

}

export type CustomerReferralOrderDocment = HydratedDocument<CustomerReferralOrder>;
export const CustomerReferralOrderModel = SchemaFactory.createForClass(CustomerReferralOrder);
