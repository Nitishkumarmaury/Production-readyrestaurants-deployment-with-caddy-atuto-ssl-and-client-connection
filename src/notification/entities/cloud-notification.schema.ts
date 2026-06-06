import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';
import { notification_to, notification_via, notificationType } from 'src/admin/dto/admin.dto';


@Schema({ timestamps: true })
export class CloudNotification {

  @Prop({ enum: notification_to, default: notification_to.Customers })
  send_notification_to: notification_to;

  @Prop({ type: [String] })
  selected_ids: string[];
  
  @Prop({ enum: notification_via, default: notification_via })
  send_notification_via: notification_via;
  
  @Prop({ type: String })
  title: string;
  
  @Prop({ type: String })
  description: string;
  
  @Prop({ enum: notificationType, default: notificationType.Immediately })
  type: notificationType;
  

  @Prop({ type: Date, default: null })
  custom_date: Date;

  @Prop({ type: [Number], default: null })
  monthly: number[];

  @Prop({ type: [String], default: null })
  weekly: string[];

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Customers", default : null })
  // customer_id: string;
}

export type CloudNotificationDocment = HydratedDocument<CloudNotification>;
export const CloudNotificationModel = SchemaFactory.createForClass(CloudNotification);

