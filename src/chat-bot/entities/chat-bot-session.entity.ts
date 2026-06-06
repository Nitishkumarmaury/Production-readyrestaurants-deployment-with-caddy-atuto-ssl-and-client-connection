import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatBotSessionDocument = ChatBotSession & Document;

@Schema({ timestamps: true })
export class ChatBotSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId;

  @Prop({ default: 'active', enum: ['active', 'ended'] })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ChatBotChatHistory' }], default: [] })
  chats: Types.ObjectId[];


}

export const ChatBotSessionSchema = SchemaFactory.createForClass(ChatBotSession);
export const ChatBotSessionModel = SchemaFactory.createForClass(ChatBotSession);

