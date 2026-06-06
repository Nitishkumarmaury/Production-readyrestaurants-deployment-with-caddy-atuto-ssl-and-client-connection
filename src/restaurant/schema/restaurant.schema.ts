import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';



export class Availability {
  @Prop({ required: false, type: String, default: null })
  public table!: string;

  @Prop({ required: false, type: Number, default: null })
  public seats!: number;
}


class Slots {
  @Prop()
  start_time: string;

  @Prop()
  end_time: string;
}

class Discount {

  @Prop()
  discount: number;

  @Prop()
  start_time: number;

  @Prop()
  end_time: number;
}




export class WorkingDay {
  @Prop()
  day: string;

  @Prop({ default: false })
  is_24_hrs: boolean;

  @Prop({ default: null })
  day_id: string;



  @Prop({ type: [Slots], default: null })
  timing: Slots[];
}
export enum restaurantStatus {
  Online = 'online',
  Offline = 'offline',
}

export enum RestaurantVerificationStatus {
  NULL = null,
  // PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum MenuType {
  ADMIN = 'admin',
  CUSTOM = 'custom'
}

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) // Add reference to Vehicle schema
  vendor_id: string;

  @Prop({ type: String, default: null })
  restaurant_name: string;

  @Prop({ type: String, default: null })
  restaurant_phone: string;

  @Prop({ type: Number, default: 0 })
  average_preparing_time: number;


  @Prop({ type: Boolean, default: false })  // false - admin menu true - custom menu
  is_custom_menu: boolean;



  @Prop({
    type: {
      name: String,
      building_no: String,
      tower: String,
      area: String,
      city: String,
      nearby_landmark: String,
      lat: String,
      long: String,
    },
    default: null,
  })
  address: {
    name: string;
    building_no: string;
    tower: string;
    area: string;
    city: string;
    nearby_landmark: string;
    lat: String;
    long: String;
  };

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location: { type: string; coordinates: number[] };

  @Prop({ type: String, default: null })
  country_code: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  food_licence_image: string;


  @Prop({
    type: String,
    enum: restaurantStatus,
    default: restaurantStatus.Offline,
  })
  status: restaurantStatus;

  @Prop({ type: [WorkingDay], default: null })
  working_day: WorkingDay[];

  @Prop({ type: [WorkingDay], default: null })
  dine_out_working_day: WorkingDay[];


  @Prop({ type: [String], default: null })
  food_type: string[];

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_block: boolean;

  @Prop({ type: String, default: null })
  reason: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ type: Boolean, default: null })
  is_restaurant_verified: boolean;

  @Prop({ type: Boolean, default: false })
  is_profile_completed: boolean;

  // @Prop({ type: Boolean, default: false })
  // is_submit_verification: boolean;

  // @Prop({ type: Boolean, default: false })
  // is_restaurant_update: boolean

  // @Prop({ default: false })
  // is_docs_update: boolean;

  @Prop({
    type: String,
    enum: RestaurantVerificationStatus,
    default: RestaurantVerificationStatus.APPROVED,
  })
  verification: RestaurantVerificationStatus

  // @Prop({
  //   type: String,
  //   enum: RestaurantVerificationStatus,
  //   default: RestaurantVerificationStatus.NULL,
  // })
  // doc_update_verification: RestaurantVerificationStatus

  @Prop({ type: Boolean, default: false })
  is_quick_pick: boolean

  @Prop({ type: Number })
  quick_pick_time: number;

  @Prop({ default: 0 })
  total_orders: number;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'ReportReason', default: null })
  report_reason_id: string;


  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: Discount, default: null })
  restaurant_discount: Discount;

  @Prop({ default: false })
  restaurant_discount_update: boolean;

  // @Prop({ type: Boolean, default: false })
  // is_verfication_submitted: boolean;


  @Prop({ enum: RestaurantType, default: RestaurantType.Restaurant })
  restaurant_type?: string;

  @Prop({ type: Boolean, default: false })
  isFoodDelivery: boolean;

  @Prop({ type: Boolean, default: false })
  isDineOut: boolean;

  @Prop({ type: Boolean, default: false })
  dealProvider: boolean;

  @Prop({ type: Boolean, default: true })
  isSubscriptionProvide: boolean;

  @Prop({ type: Boolean, default: false })
  catering_services: boolean;

  @Prop({ type: Number, default: 0 })
  estimated_price_per_plate: number;

  @Prop({ type: Number, default: 0 })
  booking_amount: number;

  @Prop({ type: [String], default: [] })
  uploadRestaurantMenu?: string[];

  @Prop({ type: [String], default: [] })
  uploadRestaurantPhotos?: string[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }], default: [] })
  services: string[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenities' }], default: [] })
  amenities?: string[];


  @Prop({ type: Number, default: 0 })
  maximum_capacity_slot: number;

  @Prop({ type: Number, default: null })
  buffer_time: number;

  @Prop({ type: () => Availability, default: [] })
  total_availability!: Availability[];

  @Prop({ type: Number, default: 0 })
  subscribers_limit: { type: Number, default: 0 }

  @Prop({ type: Boolean, default: false })
  is_delivery_available: boolean;

  @Prop({ type: Number, default: 0 })
  delivery_price_per_km: number;

  @Prop({ type: Number, default: 0 })
  delivery_range_in_km: number;

  @Prop({ type: String, default: null }) 
  qr_code_image: string;

  @Prop({ type: String, default: null }) 
  qr_code_for_table: string;

  @Prop({ type: [Number], index: 'vector', default: [] })
  embedding: number[];

}

export type RestaurantDocment = HydratedDocument<Restaurant>;
export const RestaurantModel = SchemaFactory.createForClass(Restaurant);
RestaurantModel.index({ location: '2dsphere' });