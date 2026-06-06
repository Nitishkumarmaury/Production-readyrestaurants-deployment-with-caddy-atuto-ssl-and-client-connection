import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OwnerDocument = HydratedDocument<Owner>;

export enum OwnerStatus {
  Pending = 'PENDING',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

export enum DomainStatus {
  Pending = 'pending',
  Verified = 'verified',
  Failed = 'failed',
}

export enum SslStatus {
  Pending = 'pending',
  Active = 'active',
  Failed = 'failed',
}

export type OwnerUrl = {
  adminUrl: string;
  customerUrl: string;
  vendorUrl: string;
};

export type OwnerDnsRecord = {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
};

@Schema({ timestamps: true })
export class Owner {
  @Prop({ default: 'owner' })
  role: string;

  @Prop({ default: null })
  full_name: string;

  @Prop({ default: null, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone_number: string;

  @Prop({ required: true, trim: true })
  country_code: string;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 'english' })
  language: string;

  @Prop({ default: OwnerStatus.Pending, enum: Object.values(OwnerStatus) })
  status: OwnerStatus;

  @Prop({ default: false })
  is_email_verify: boolean;

  @Prop({ default: false })
  is_phone_verify: boolean;

  @Prop({ default: 'Asia/Kolkata' })
  time_zone: string;

  @Prop({ default: false })
  is_subscribed: boolean;

  @Prop({ default: true })
  is_trial: boolean;

  @Prop({ default: null })
  trial_start_date: number;

  @Prop({ default: null })
  trial_end_date: number;

  @Prop({ default: null })
  companyName: string;

  @Prop({ default: null, unique: true, sparse: true, lowercase: true, trim: true })
  subdomain_slug: string;

  @Prop({ default: null })
  original_domain: string;

  @Prop({ default: null, unique: true, sparse: true, lowercase: true, trim: true })
  custom_domain: string;

  @Prop({ default: DomainStatus.Pending, enum: Object.values(DomainStatus) })
  domain_status: DomainStatus;

  @Prop({ default: SslStatus.Pending, enum: Object.values(SslStatus) })
  ssl_status: SslStatus;

  @Prop({ default: null })
  domain_verification_token: string;

  @Prop({
    type: [
      {
        type: { type: String, enum: ['TXT', 'CNAME'], required: true },
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    default: [],
  })
  domain_records: OwnerDnsRecord[];

  @Prop({ default: null })
  location: string;

  @Prop({ default: null })
  gst_no: string;

  @Prop({ type: [String], default: [] })
  modules_available: string[];

  @Prop({ default: null })
  databaseUrl: string;

  @Prop({
    type: {
      adminUrl: { type: String, default: null },
      customerUrl: { type: String, default: null },
      vendorUrl: { type: String, default: null },
    },
    default: {},
  })
  url: OwnerUrl;

  @Prop({ default: null })
  phone_otp: string;

  @Prop({ default: null })
  phone_otp_at: number;

  @Prop({ default: null })
  subscription_plan: string;
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);
OwnerSchema.index({ country_code: 1, phone_number: 1 }, { unique: true });
