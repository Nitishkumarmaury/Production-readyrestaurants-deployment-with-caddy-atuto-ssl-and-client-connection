import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import * as moment from 'moment';
import { bool } from 'aws-sdk/clients/signer';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';

@Schema({ timestamps: true })
export class GroceryItems {
  
//   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
//   restaurant_id: string;

    @Prop({ enum: RestaurantType, default: RestaurantType.Grocery })
    type?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category_id: string;
  
    @Prop({ type: String, default: null })
    name: string;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: String, default: null })
    size: string;

    @Prop({ type: String, default: null })
    quantity: string;

    @Prop({ type: String, default: null })
    unit: string;
    
    @Prop({ type: Number, default: null })
    price: number;

    @Prop({ type: String, default: null })
    imageUrl: string;

    @Prop({ default: false })
    is_deleted: boolean;

}

// Create schema factories
export type GroceryItemsDocument = HydratedDocument<GroceryItems>;
export const GroceryItemsModel = SchemaFactory.createForClass(GroceryItems);
