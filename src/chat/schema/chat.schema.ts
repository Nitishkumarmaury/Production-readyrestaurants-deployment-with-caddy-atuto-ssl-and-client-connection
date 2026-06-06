import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
enum sent_by {
  Customer = 'customer',
  Driver = 'driver',
}
@Schema()
export class Chats {
  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Connections' }) // Add reference to Vehicle schema
  connection_id: string;

  @Prop(  {type: mongosse.Schema.Types.ObjectId }) // Add reference to Vehicle schema
  sent_id: string;

  @Prop( {type: mongosse.Schema.Types.ObjectId }) // Add reference to Vehicle schema
  receiver_id: string;


  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Orders' }) // Add reference to Vehicle schema
  order_id: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Connections' })
  sent_by: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: null })
  message: string;

  @Prop({ default: +new Date() })
  updated_at: number;

  @Prop({ default: +new Date() })
  created_at: number;
}
export type ChatsDocment = HydratedDocument<Chats>;
export const ChatsModel =SchemaFactory.createForClass(Chats);