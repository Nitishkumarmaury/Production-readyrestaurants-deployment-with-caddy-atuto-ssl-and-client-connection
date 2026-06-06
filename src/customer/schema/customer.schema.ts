import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

class CustomerReferral {

  @Prop({ default: null })
  referral_code: string;

  @Prop({ type: Number, required: false })
  number_of_persons: number;

  @Prop({ type: Number, required: false })
  number_of_orders: number;

  @Prop({ type: Number, required: false })
  amount: number;


  @Prop({ default: null })
  status: string;

  @Prop({ default: null })
  expired_date: number;

}


@Schema({ timestamps: true })
export class Customers {
  @Prop({ type: String, default: null })
  name: string;

  @Prop({ type: String, default: null })
  email: string;

  @Prop({ type: String, default: null })
  country_code: string;

  @Prop({ type: String, default: null })
  phone: string;

  @Prop({ type: String, default: null })
  image: string;


  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'CustomerAddress' }) // Add reference to Vehicle schema
  current_address: string;


  @Prop({ type: String, default: null })
  temp_email: string;

  @Prop({ type: String, default: null })
  temp_phone: string;

  @Prop({ type: String, default: null })
  temp_country_code: string;

  @Prop({ type: Number, default: null })
  temp_email_otp: number;

  @Prop({ type: Number, default: null })
  temp_phone_otp: number;

  @Prop({ type: Number, default: null })
  temp_email_otp_at: number;

  @Prop({ type: Number, default: null })
  temp_phone_otp_at: number;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_block: boolean;

  @Prop({ type: String, default: null })
  block_reason: string;

  @Prop({ type: Boolean, default: false })
  is_email_verify: boolean;

  @Prop({ type: Boolean, default: false })
  is_phone_verify: boolean;

  @Prop({ type: String, default: null })
  device_type: string;

  @Prop({ default: 0 })
  ratings: number;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: String, default: null })
  delete_reason: string;


  @Prop({ type: String, default: null })
  delete_description: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'ReportReason', default: null })
  report_reason_id: string;

  @Prop({ default: null })
  wallet_balance: number;

  @Prop({ type: CustomerReferral, required: false })
  referral?: CustomerReferral;


  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Customers", required: false, default: null })
  referral_user: string;


  @Prop({ default: false })
  is_card_added: boolean;

  @Prop({ type: String, default: null })
  stripe_customer_id: string;

  @Prop({ default: null })
  socket_id: string;

  @Prop({ default: null })
  connection_id: string;

  @Prop({ type: String, default: 'USD' })
  preferred_currency: string;

  @Prop({ type: String, default: 'english' })
  preferred_language: string;

  @Prop({ type: String, default: '$' })
  currency_symbol: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: String, default: '' })
  dob: string;
  
  @Prop({ type: String, default: '' })
  anniversary_date: string;

  @Prop({ type: String, enum: ['male', 'female', 'other'], default: null,
      set: (value: string) => value?.trim().toLowerCase(),
   })
  gender: string;
}

export type CustomersDocment = HydratedDocument<Customers>;
export const CustomersModel = SchemaFactory.createForClass(Customers);
