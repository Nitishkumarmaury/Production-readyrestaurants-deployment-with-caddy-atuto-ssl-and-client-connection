import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as moment from 'moment';
import { Drivers } from 'src/driver/schema/driver.schema';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';
import { Orders } from 'src/order/schema/order.schema';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';

export enum PayoutStatus {
  Pending = "pending",
  Success = "success",
  Failed = "failed",
}

export enum PayoutType {
  Driver = "driver",
  Restaurant = "restaurant",
}

@Schema({ timestamps: true })
export class Payout {
  @Prop({ type: String, enum: PayoutType, required: true })
  type: PayoutType; // driver | restaurant

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Drivers.name, default: null })
  driver_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Restaurant.name, default: null })
  restaurant_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Orders.name, default: null })
  order_id: string;

  @Prop({ type: Number, required: true })
  amount: number; // final payout amount

  @Prop({ type: Number, default: 0 })
  delivery_charge: number; // applicable for driver

  @Prop({ type: Number, default: 0 })
  food_amount: number; // applicable for restaurant

  @Prop({ type: Number, default: 0 })
  commission: number; // commission deducted (from driver or restaurant)

  @Prop({ type: String, default: null })
  transaction_ref: string; // transaction id from payment gateway

  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.Pending })
  status: PayoutStatus; // success | failed | pending

  @Prop({ type: String, default: null })
  failure_reason: string; // in case of failure

  @Prop({ type: String, default: null })
  fund_account_id: string; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bank', default: null })
  bank_account_id: string;

  // 📅 Weekly payout period
  @Prop({ type: Date, default: null })
  payout_week_start: Date;

  @Prop({ type: Date, default: null })
  payout_week_end: Date;

  // 🧾 Invoice link (PDF or S3 path etc.)
  @Prop({ type: String, default: null })
  invoice_url: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;


  @Prop({
      required: false,
      enum: PaymentGateway,
      default: PaymentGateway.STRIPE
  
    })
  payment_by : PaymentGateway;

}

export type PayoutDocument = HydratedDocument<Payout>;
export const PayoutModel = SchemaFactory.createForClass(Payout);
