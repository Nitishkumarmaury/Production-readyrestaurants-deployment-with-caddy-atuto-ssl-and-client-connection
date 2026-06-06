import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Customers } from 'src/customer/schema/customer.schema';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
export class PushNotificationObj {
  @Prop({ required: false })
  title: string;

  @Prop({ required: false })
  body: string;
}

export const PushNotificationObjSchema =
  SchemaFactory.createForClass(PushNotificationObj);

@Schema({ _id: false })
export class PushNotificationDataObj {
  @Prop({ required: false })
  type: string;

  @Prop({ required: false })
  redirectPath: string;


  @Prop({ required: false })
  order_id: string;

  // @Prop({ required: true })
  // uniqueId: string;
}

export const PushNotificationDataObjSchema =
  SchemaFactory.createForClass(PushNotificationDataObj);

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: PushNotificationObjSchema, required: true })
  notification: PushNotificationObj;

  @Prop({ type: PushNotificationDataObjSchema, required: true })
  data: PushNotificationDataObj;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Customers.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Restaurant.name, required: false })
  resturantId: Types.ObjectId | null;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isVendor: boolean;

  @Prop({ default: false })
  isCustomer: boolean;

  @Prop({ default: false })
  isDriver: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
export const NotificationModel = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ 'data.uniqueId': 1 });
