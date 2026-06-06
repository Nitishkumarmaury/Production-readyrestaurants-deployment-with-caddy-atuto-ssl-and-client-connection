import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';

@Schema()
export class QuickPicks {

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Restaurant" })
  restaurant: string;

  @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Admin" })
  created_by: string;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;
}
export type QuickPicksDocument = HydratedDocument<QuickPicks>;
export const QuickPicksModel = SchemaFactory.createForClass(QuickPicks);
