import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FoodItems } from 'src/food/schema/food-item.schema';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';

export type ChatBotChatHistoryDocument = ChatBotChatHistory & Document;

@Schema({ timestamps: true })
export class ChatBotChatHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId;

  @Prop({ required: true })
  user_query: string;

  @Prop({ required: true })
  bot_reply: string;

  @Prop({ type: Types.ObjectId, ref: 'ChatBotSession', required: true })
  session_id: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: FoodItems.name, default: [] })
  matched_food_items: Types.ObjectId[]; // Optional: store food items matched by vector search

  @Prop({ type: [Types.ObjectId], ref: Restaurant.name, default: [] })
  matched_restaurants: Types.ObjectId[]; // Optional: store restaurants matched by vector search
}

export const ChatBotChatHistorySchema = SchemaFactory.createForClass(ChatBotChatHistory);
export const ChatBotChatHistoryModel = SchemaFactory.createForClass(ChatBotChatHistory);
