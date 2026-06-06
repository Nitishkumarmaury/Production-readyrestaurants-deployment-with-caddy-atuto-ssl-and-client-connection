import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { Orders } from "../../order/schema/order.schema"
import { Wallet } from 'src/wallet/entities/wallet.entity';


export enum EarningType {
  Current = 'current',
  Schedule = 'schedule',
  
  Pos = 'pos',
  Grocery = 'grocery',
  Pharmacy = "pharmacy",
  Electronics = "electronics",
  Cloth = "cloth",

  Catering = "catering",
  Deal = "deal",
  SlotBooking = "slot_booking"
}



export enum payment_type {
  Card = "card",
  Cash = 'cash',
  Wallet = 'wallet',
  Pos = 'pos',
  UPI = 'upi',

}
@Schema({ timestamps: true })
export class Earnings {

  
  @Prop({ default: null })
  reference_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers', default : null }) // Add reference to Vehicle schema
  customer_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: Orders.name , default : null }) // Add reference to Vehicle schema
  order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'DriverOrders' , default : null })
  driver_order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Restaurant' , default : null}) // Add reference to Vehicle schema
  restaurant_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' ,default : null }) // Add reference to Vehicle schema
  vendor_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Driver', default : null }) // Add reference to Vehicle schema
  driver_id: string;


  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Slot", default : null })
  slot_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "DealBuy", default : null })
  deal_order_id: string;


  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "CustomerSlot", default : null })
  booking_id: string;

  @Prop({ default: null })
  delivery_charge: number;

  @Prop({ default: null })
  food_amount: number;

  @Prop({ default: 0 })
  coupon_amount: number;

  @Prop({ default: null })
  commission_from_restaurant: number;

  @Prop({ default: null })
  commission_from_driver: number;

  @Prop({ default: null })
  restaurant_earning: number;

  @Prop({ default: null })
  driver_earning: number;


  @Prop({ default: null })
  tax: number;

  @Prop({ default: null })
  total_amount: number;

  @Prop({ type: String, enum: payment_type, default: null })
  payment_type: payment_type;

  @Prop({ type: String, enum: EarningType, default: null })
  earning_type: EarningType;

  @Prop({ default: null })
  pay_to_driver: string;

  @Prop({ default: null })
  pay_to_vendor: string;

  @Prop({ default: null })
  order_placed_at: number;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type EarningsDocument = HydratedDocument<Earnings>;
export const EarningsModel = SchemaFactory.createForClass(Earnings);
