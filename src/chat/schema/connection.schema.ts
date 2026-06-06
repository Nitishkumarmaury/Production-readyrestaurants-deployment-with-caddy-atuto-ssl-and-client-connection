import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
enum sent_by {
  Customer = 'customer',
  Driver = 'driver',
}
@Schema()
export class Connections {
  @Prop({default:null}) // Add reference to Vehicle schema
  sent_by: string;

  @Prop({default:null}) // Add reference to Vehicle schema
  received_by: string;

  @Prop({ default: null })
  last_message: string;

  @Prop({ default: +new Date() })
  updated_at: number;

  @Prop({ default: +new Date() })
  created_at: number;
}
export type ConnectionsDocment = HydratedDocument<Connections>;
export const ConnectionsModel =SchemaFactory.createForClass(Connections);