import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";
import { RestaurantType } from "src/vendor/schema/vendor.schema";

@Schema({ timestamps: true })
export class Category {

  @Prop({ type: String,  unique: false, default: null })
  category_name: string;

  @Prop({ type: String, default: null })
  category_image: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) // Add reference to Vehicle schema
  vendor_id: string;

  @Prop({ type: Boolean, default: false })
  is_default: boolean;

  @Prop({ enum: RestaurantType, default: RestaurantType.Restaurant })
  restaurant_type?: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  catering_services: boolean;

}

export type CategoryDocment = HydratedDocument<Category>;
export const CategoryModel = SchemaFactory.createForClass(Category);

CategoryModel.index({ category_name: 'text' });

// AUTO SOFT DELETE FILTER
CategoryModel.pre(/^find/, function (next) {
  (this as mongosse.Query<any, any>).where({ is_deleted: false });
  next();
});

CategoryModel.pre('aggregate', function (next) {
  const pipeline = this.pipeline();
  pipeline.unshift({
    $match: { is_deleted: false }
  });
  next();
});
