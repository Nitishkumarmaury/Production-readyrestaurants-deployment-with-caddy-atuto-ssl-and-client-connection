import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import * as moment from 'moment';
import { bool } from 'aws-sdk/clients/signer';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';

// VariantKeys schema
@Schema({ _id: true })
export class VariantKeys {
  @Prop({ default: null })
  title: string;

  @Prop({ default: 0 })
  add_price: number;

  @Prop({ default: 0 })
  final_price: number;
}

// CustomizationKeys schema
@Schema({ _id: true })
export class CustomizationKeys {
  @Prop({ default: null })
  title: string;

  @Prop({ default: null })
  customer_selection: string;

  @Prop({ default: 0 })
  additional_price: number;
}

// MakeItOwn schema
@Schema({ _id: true })
export class MakeItOwn {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'CustomizationGroups' })
  group_id: string;

  @Prop({ default: null })
  title: string;

  @Prop({ default: null })
  customer_selection: string;

  @Prop({ default: 0 })
  additional_price: number;
}

// Slots schema
@Schema({ _id: true })
export class Slots {
  @Prop()
  start_time: string;

  @Prop()
  end_time: string;
}

// ItemTiming schema
@Schema({ _id: true })
export class ItemTiming {
  @Prop()
  day: string;

  @Prop()
  day_id: string;

  @Prop()
  start_time: string;

  @Prop()
  end_time: string;
}

// FoodItems schema
@Schema()
export class FoodItems {
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' , default : null })
  restaurant_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' , default : null })
  category_id: string;

  @Prop({ type: String, default: null })
  food_type: string;

  @Prop({ type: [String], default: null })
  image: string[];

  @Prop({ type: String, default: null })
  name: string;

  @Prop({ default: null })
  price: number;
  
  @Prop({ default: null })
  discounted_price: number;

  @Prop({ type: [VariantKeys], default: [] })  // Ensure array has schema with _id
  pieces: VariantKeys[];

  @Prop({ type: [VariantKeys], default: [] })  // Ensure array has schema with _id
  quantity: VariantKeys[];

  @Prop({ type: [VariantKeys], default: [] })  // Ensure array has schema with _id
  size: VariantKeys[];

  @Prop({ type: [CustomizationKeys], default: [] })  // Ensure array has schema with _id
  add_ons: CustomizationKeys[];

  @Prop({ type: [CustomizationKeys], default: [] })  // Ensure array has schema with _id
  toppings: CustomizationKeys[];

  @Prop({ type: [MakeItOwn], default: [] })  // Ensure array has schema with _id
  make_your_own: MakeItOwn[];

  @Prop({ type: [ItemTiming], default: [] })  // Ensure array has schema with _id
  item_timing: ItemTiming[];


  @Prop({ default: null })
  availability_type: string;


  @Prop({ default: true })
  is_available: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ type: Number, default: null })
  extimate_time: number;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: Boolean, default: false })
  is_recommend: boolean

  @Prop({ type: Number, default: false })
  sort_index: { type: Number, default: null }

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: [Number], index: 'vector', default: [] })
  embedding: number[];

  @Prop({ type: Number, default: 0 })
  order_count: { type: Number, default: 0 }

  @Prop({ type: Number, default: 0 })
  trending_count: { type: Number, default: 0 }

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'HomeCookedServices' , default : null })
  home_cooked_service_id: string;


  @Prop({ enum: RestaurantType, default: RestaurantType.Restaurant })
  restaurant_type?: string;

  @Prop({ type: Boolean, default: false })
  catering_services: boolean;

  @Prop({ default: false })
  is_deleted: boolean;



}

// Create schema factories
export type FoodItemsDocument = HydratedDocument<FoodItems>;
export const FoodItemsModel = SchemaFactory.createForClass(FoodItems);
export const VariantKeysSchema = SchemaFactory.createForClass(VariantKeys);
export const CustomizationKeysSchema = SchemaFactory.createForClass(CustomizationKeys);
export const MakeItOwnSchema = SchemaFactory.createForClass(MakeItOwn);
export const SlotsSchema = SchemaFactory.createForClass(Slots);
export const ItemTimingSchema = SchemaFactory.createForClass(ItemTiming);



// AUTO SOFT DELETE FILTER
FoodItemsModel.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).where({ is_deleted: false });
  next();
});

FoodItemsModel.pre('aggregate', function (next) {
  const pipeline = this.pipeline();

  const hasSearchStage = pipeline.length && (pipeline[0] as any)?.$search;

  if (hasSearchStage) {
    // agar $search already first stage hai → $match ko baad me daalo
    pipeline.push({
      $match: { is_deleted: false }
    });
  } else {
    // normal case → pehle daal do
    pipeline.unshift({
      $match: { is_deleted: false }
    });
  }

  next();
});
