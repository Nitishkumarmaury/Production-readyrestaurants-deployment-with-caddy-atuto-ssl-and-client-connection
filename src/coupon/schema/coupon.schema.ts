import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";
enum CouponType {
  OneTime = "one-time",
  InApp = "in-app",
}

enum Added_by {
  Vendor = "vendor",
  Admin = "admin",
}
@Schema()
export class Coupons {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Restaurant" }) // Add reference to Vehicle schema
  restaurant_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Vendor" }) // Add reference to Vehicle schema
  vendor_id: string;

  @Prop({ default: null })
  code: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  discount_percentage: number;

  @Prop({ default: null })
  minimum_booking_amount: number;

  @Prop({ default: null })
  valid_upto: number;

  @Prop({ default: null })
  maximum_discount_amount: number;

  @Prop({ type: String, enum: CouponType })
  type: string;

  @Prop({ type: String, enum: Added_by })
  added_by: string;

  @Prop({ type: [String], default: [] }) // Changed to an array of strings
  used_by: string[];

  @Prop({ default: null })
  date_of_use: number;

  @Prop({ default: "active" })
  status: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}

export type CouponsDocment = HydratedDocument<Coupons>;
export const CouponsModel = SchemaFactory.createForClass(Coupons);
