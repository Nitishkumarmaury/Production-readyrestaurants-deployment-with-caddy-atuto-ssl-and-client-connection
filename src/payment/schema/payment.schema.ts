import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { PaymentGateway } from 'src/configuration/dto/update-configuration.dto';
export enum PaymentStatus {
  Pending = "pending",
  Complete = 'complete',
  Refunded = 'refunded'
}

export enum payment_type {
  Card = "card",
  Cash = 'cash',
  Wallet = 'wallet',
  UPI = 'upi',  
  Pos = 'pos',
}
@Schema()
export class Payments {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers' }) // Add reference to Vehicle schema
  customer_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Order', default : null}) // Add reference to Vehicle schema
  order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'DriverOrders' , default : null })
  driver_order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Restaurant' }) // Add reference to Vehicle schema
  restaurant_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Slot", default : null })
  slot_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "CustomerSlot", default : null })
  booking_id: string;


  @Prop({ default: null })
  payment_method_id: string;

  @Prop({ default: null })
  payment_intent: string;

  @Prop({ default: null })
  total_amount: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
  payment_status: PaymentStatus;

  @Prop({ type: String, enum: payment_type, default: null })
  payment_type: payment_type;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({
      required: false,
      enum: PaymentGateway,
      default: PaymentGateway.STRIPE
    })
  paymentGateway: PaymentGateway;

}
export type PaymentsDocment = HydratedDocument<Payments>;
export const PaymentsModel = SchemaFactory.createForClass(Payments);
