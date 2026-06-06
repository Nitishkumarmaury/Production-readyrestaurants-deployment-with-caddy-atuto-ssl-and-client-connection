
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FoodItems } from 'src/food/schema/food-item.schema';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';

export type EmbeddingDocument = Embedding & Document;

@Schema({ timestamps: true })
export class Embedding {
  @Prop({ type: Types.ObjectId, ref: FoodItems.name, required: false })
  food_item_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Restaurant.name, required: false })
  restaurant_id?: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  vector: number[]; // The actual embedding array

  @Prop({ required: false })
  source: string; // "food_item" | "restaurant" (optional but useful for queries)
}

export const EmbeddingSchema = SchemaFactory.createForClass(Embedding);
export const EmbeddingModel = SchemaFactory.createForClass(Embedding);
