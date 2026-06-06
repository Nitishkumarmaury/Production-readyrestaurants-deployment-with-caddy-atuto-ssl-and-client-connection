import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose, { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

export enum DriverVerificationStatus {
  NULL = null,
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Drivers {
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
  formatted_address: string;

  @Prop({ type: String, default: null })
  latitude: string;

  @Prop({ type: String, default: null })
  longitude: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      // required: true,
      default: [0, 0],
    },
  })
  location: { type: string; coordinates: number[] };

  @Prop({ type: String, default: null })
  heading: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Vehicles" })
  vehicle_id: string;

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

  @Prop({ type: String, default: null })
  licence_front_image: string;

  @Prop({ type: String, default: null })
  licence_back_image: string;

  @Prop({ type: Number, default: null })
  licence_expiry_date: number;

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

  @Prop({ default: "offline" })
  status: string;

  @Prop({ default: "free" })
  ride_status: string;

  @Prop({ default: false })
  set_up_profile: boolean;

  @Prop({ default: null })
  is_approved: boolean;

  @Prop({ default: false })
  is_docs_update: boolean;

  @Prop({ default: 0 })
  docs_approved_on: number;

  @Prop({ type: String, default: null })
  reject_reason: string;

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

  @Prop({ default: false })
  currently_send_ride_request: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Orders" , default : null })
  currently_send_ride_request_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Orders" })
  current_order: string;

  @Prop({ default: null })
  currently_send_ride_request_generate_at: number;

  @Prop({ type: String, default: 'USD' })
  preferred_currency: string;

  @Prop({ type: String, default: 'english' })
  preferred_language: string;

  @Prop({ type: String, default: '$' })
  currency_symbol: string;

  @Prop({ default: null })
  deactivate_at: number;

  @Prop({ type: String, default: null })
  delete_reason: string;


  @Prop({ type: String, default: null })
  delete_description: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'ReportReason', default: null })
  report_reason_id: string;

  @Prop({ type: Boolean, default: false })
  is_verfication_submitted: boolean;

  @Prop({
    type: String,
    enum: DriverVerificationStatus,
    default: DriverVerificationStatus.NULL,
  })
  verification: DriverVerificationStatus

  @Prop({
    type: String,
    enum: DriverVerificationStatus,
    default: DriverVerificationStatus.NULL,
  })
  doc_update_verification: DriverVerificationStatus

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: String, default: null })
  visa_doc: string;

  @Prop({ type: String, default: null })
  insurance_doc: string;

  @Prop({ type: String, default: null })
  rego_doc: string;

  @Prop({ type: String, default: null })
  police_clearance: string;

  @Prop({ type: Number, default: null })
  rego_expiry_date: number;

  @Prop({ type: Number, default: null })
  visa_expiry_date: number;

  @Prop({ type: Number, default: null })
  insurance_expiry_date: number;

  @Prop({ default: null })
  doc_expiry_type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "ServiceLocation", default: null })
  zone_id: string;
  
}

export type DriversDocment = HydratedDocument<Drivers>;
export const DriversModel = SchemaFactory.createForClass(Drivers);
DriversModel.index({ location: '2dsphere' });