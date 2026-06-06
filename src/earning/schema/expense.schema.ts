import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { Orders } from "../../order/schema/order.schema"
import { Wallet } from 'src/wallet/entities/wallet.entity';


export enum ExpensesBy {
  Customer = 'customer',
  Restaurant = 'restaurant',
  Driver = 'driver',
  Vendor = 'vendor',
  Admin = 'admin',
}

export enum ExpensesType {
  Order = 'order',
}



@Schema({ timestamps: true })
export class  Expenses {


  @Prop({ type: String, enum: ExpensesBy, default: null })
  expenses_by: ExpensesBy;


  @Prop({ type: String, enum: ExpensesType, default: null })
  expenses_type: ExpensesType;


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
  amount: number;

  
}
export type ExpensesDocument = HydratedDocument<Expenses>;
export const ExpensesModel = SchemaFactory.createForClass(Expenses);
