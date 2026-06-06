import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";

export enum RestaurantType {
  Restaurant = "restaurant",
  HomeCookedMeal = "home-cooked-meal",
  BothHomeRest = "both-home-rest",
  Grocery = "grocery",

  Pharmacy = "pharmacy",
  Electronics = "electronics",
  Cloth = "cloth"
}

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Restaurant" })
  restaurant_id: string;

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

  @Prop({ type: Boolean, default: false })
  is_address_added: boolean;

  @Prop({ type: Boolean, default: false })
  is_detail_added: boolean;

  @Prop({ type: Boolean, default: false })
  is_timing_added: boolean;

  @Prop({ type: Boolean, default: false })
  is_bank_added: boolean;

  @Prop({ type: Boolean, default: false })
  is_menu_added: boolean;

  @Prop({ type: Boolean, default: false })
  is_verfication_submitted: boolean;

  // @Prop({ type: Boolean, default: null })
  // is_restaurant_verified: boolean;

  @Prop({ type: String, default: null })
  device_type: string;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: String, default: null })
  stripe_customer_id: string;

  @Prop({ type: String, default: null })
  razor_contact_id: string;

  @Prop({ type: String, default: null })
  razor_fund_account_id: string;

  @Prop({ type: String, default: null })
  country: string;

  @Prop({ default: null })
  socket_id: string;

  @Prop({ default: null })
  connection_id: string;

  @Prop({ type: String, default: "USD" })
  preferred_currency: string;

  @Prop({ type: String, default: "english" })
  preferred_language: string;

  @Prop({ type: String, default: "$" })
  currency_symbol: string;

  @Prop({ type: String, default: null })
  delete_reason: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'ReportReason', default: null })
  report_reason_id: string;

  // @Prop({ enum: RestaurantType, default: RestaurantType.Restaurant })
  // restaurant_type?: string;



  @Prop({ type: String, default: null })
  delete_description: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}

export type VendorDocment = HydratedDocument<Vendor>;
export const VendorModel = SchemaFactory.createForClass(Vendor);
