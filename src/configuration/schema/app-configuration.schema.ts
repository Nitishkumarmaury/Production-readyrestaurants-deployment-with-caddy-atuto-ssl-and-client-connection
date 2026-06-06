import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from "moment";
import mongoose, { HydratedDocument } from "mongoose";
import { WorkingDay } from 'src/restaurant/schema/restaurant.schema';
// import { PaymentGateway } from '../dto/update-configuration.dto';

export enum PaymentGateway {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
}

export enum DeliveryFeeOptions {
  Admin = 'Admin',
  Restaurant = 'Restaurant',
  OtherPlatform = 'OtherPlatform',
}



class support {
  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  country_code: string;

  @Prop({ default: null })
  call: string;

  @Prop({ default: null })
  skype: string;
}

class Referral {
  @Prop({ type: Number, required: false })
  number_of_persons: number;

  @Prop({ type: Number, required: false })
  number_of_orders: number;

  @Prop({ type: Number, required: false })
  amount: number;

}




class social_links {
  @Prop({ default: null })
  facebook_url: string;

  @Prop({ default: null })
  instagram_url: string;

  @Prop({ default: null })
  youtube_url: string;
}

class email_creds {
  @Prop({ default: null })
  AppEmail: string;

  @Prop({ default: null })
  AppPassword: string;

}

class BucketData {

  @Prop({ default: null })
  bucket_name: string;

  @Prop({ default: null })
  do_access_key: string;

  @Prop({ default: null })
  do_secret_access_key: string;

  @Prop({ default: null })
  do_region: string;

  @Prop({ default: null })
  do_endpoint: string;

  @Prop({ default: null })
  folder: string;

}



class RazorpayData {

  @Prop({ default: null })
  key: string;

  @Prop({ default: null })
  secret: string;

  @Prop({ default: null })
  bank_account: string;

}

class StripeData {

  @Prop({ default: null })
  key: string;

  @Prop({ default: null })
  secret: string;

  @Prop({ default: null })
  webhook: string;
} 



class driver_charges {
  @Prop({ default: null })
  cloth_charge: string;

  @Prop({ default: null })
  bag_charge: string;

}

class CustomerEditProfile {
  @Prop({ type: Boolean, default: false })
  anniversary_date: boolean;

  @Prop({ type: Boolean, default: false })
  gender: boolean;

  @Prop({ type: Boolean, default: false })
  dob: boolean;
}

class tax {
  @Prop({ default: null })
  tax_keyword: string;

  @Prop({ default: null })
  tax_keyword_hindi: string;

  @Prop({ default: null })
  tax_percentage: string;

}

class service_area {
  @Prop({ default: null })
  lat: number;

  @Prop({ default: null })
  lng: number;

  @Prop({ default: null })
  location_name: string;

  @Prop({ default: null })
  admin_service_range: number

  @Prop({ default: false })
  is_all_world: boolean

}

  export enum CommissionForRestaurantBy  {

    Fixed = "fixed",
    Percentage  = "percentage"
  }


  export class SmtpCreds {
    @Prop({ default: null })
    mail_url: string;

    @Prop({ default: null })
    mail_from_email: string;

    @Prop({ default: null })
    mail_from_name: string;

    @Prop({ default: null })
    mail_key: string;
  }


  export class AppLinks {
    @Prop({ default: null })
    customer_play_store_link: string;

    @Prop({ default: null })
    customer_app_store_link: string;

    @Prop({ default: null })
    vendor_play_store_link: string;

    @Prop({ default: null })
    vendor_app_store_link: string;
  }


  
  export class FirebaseKeys {
    @Prop({ default: null , type : mongoose.Schema.Types.Mixed})
    frontend_key: object;

    @Prop({ default: null })
    vapid_Key: string;

    @Prop({ default: null , type : mongoose.Schema.Types.Mixed })
    backend_key: object;

    @Prop({ default: null, type : mongoose.Schema.Types.Mixed })
    mobile_key: object;
  }



@Schema()
export class AppConfiguration {
  @Prop({ default: null })
  product_name: string;

  @Prop({ type: support })
  support: support;

  @Prop({ type: email_creds })
  email_creds: email_creds;

  @Prop({ type: social_links })
  social_links: social_links;

  @Prop({ type: service_area })
  service_area: service_area;

  @Prop({ type: driver_charges })
  driver_charges: driver_charges;

  @Prop({ default: 0 })
  base_fee: number;

  @Prop({ default: 0 })
  distance_per_km: number;

  @Prop({ default: 0 })
  commission_percentage_for_driver: number;

  @Prop({ default: 0 })
  commission_percentage_for_restaurant: number;

  @Prop({ type: tax })
  tax: tax;

  @Prop({ default: 10 })
  order_taking_range: number;

  @Prop({enum: CommissionForRestaurantBy, default : CommissionForRestaurantBy.Percentage })
  commission_for_restaurant_by: string;



  @Prop({ default: 10 })
  show_restaurant_range: number;

  @Prop({ default: 0 })
  app_commission: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0],
    },
  })
  location: {
    type: 'Point';
    coordinates: number[];
  };

  @Prop({ default: null })
  lat: number;

  @Prop({ default: null })
  lng: number;

  @Prop({ default: null })
  location_name: string;

  @Prop({
    type: [String],
    required: true,
    example: ['dubai', 'singapore', 'sydney'],
  })
  cities: string[];


  @Prop({ type: Referral, required: false })
  referral?: Referral;

  @Prop({ type: Boolean, default: true })
  wallet: boolean;

  @Prop({ type: Boolean, default: true })
  loyalty: boolean;

  @Prop({ default: 0 })
  loyalty_minimun_order: number;

  @Prop({ default: 0 })
  amount_per_loyalty: number;


  @Prop({
    required: false,
    enum: PaymentGateway,
    default: PaymentGateway.STRIPE

  })
  paymentGateway: PaymentGateway;

  @Prop({ default: null })
  razorpay: RazorpayData;

  @Prop({ default: null })
  stripe: StripeData;

  @Prop({ type: CustomerEditProfile })
  customer_edit_profile: CustomerEditProfile;

  @Prop({ default: 5 })
  catering_commission: number;

  @Prop({
    required: false,
    enum: DeliveryFeeOptions,
    default: DeliveryFeeOptions.Admin

  })
  deliveryFeeOptions: DeliveryFeeOptions;

  @Prop({ default: null , type : mongoose.Schema.Types.Mixed})
  ui_settings: Object;


  @Prop({ default: null , type : String})
  google_map_key_backend: string;

  @Prop({ default: null , type : String})
  google_map_key_mobile: string;

  @Prop({ default: null , type : String})
  google_map_key: string;

  @Prop({ type: BucketData, default: null })
  bucket: BucketData;

  @Prop({ default: null })
  smtp_creds: SmtpCreds;

  @Prop({ default: null , type : FirebaseKeys})
  firebase_keys: FirebaseKeys;

  @Prop({ type: Boolean, default: false })
  is_fixed_time_delivery: boolean;

  @Prop({ type: [WorkingDay], default: null })
  fixed_time_delivery: WorkingDay[];


  @Prop({ default: false })
  isFreeDeliveryAvailable: boolean;

  @Prop({ default: 200 })
  freeDeliveryMinOrderAmount: number;



  @Prop({ default: null , type : AppLinks})
  app_links: AppLinks;



}

export type AppConfigurationDocument = HydratedDocument<AppConfiguration>
export const AppConfigurationModel = SchemaFactory.createForClass(AppConfiguration)
AppConfigurationModel.index({ location: '2dsphere' });