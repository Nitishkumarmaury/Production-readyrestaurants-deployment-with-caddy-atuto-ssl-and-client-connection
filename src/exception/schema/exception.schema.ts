import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ErrorLogs {
  @Prop({ default: null })
  type: string;

  @Prop({ default: null })
  error: string;  
}
export type ErrorLogsDocment = HydratedDocument<ErrorLogs>;
export const ErrorLogsModel = SchemaFactory.createForClass(ErrorLogs);
