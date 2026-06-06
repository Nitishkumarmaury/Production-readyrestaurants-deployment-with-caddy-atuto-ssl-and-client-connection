import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Languages {
  @Prop({ default: null })
  key: string;

  @Prop({ default: null })
  english: string;

  @Prop({ default: null })
  hindi: string;


  @Prop({ default: "" })
  arabic: string;

  @Prop({ default: "" })
  chinese: string;

  @Prop({ default: "" })
  french: string;

  @Prop({ default: "" })
  spanish: string;

  
  
}

export type LanguagesDocment = HydratedDocument<Languages>;
export const LanguagesModel = SchemaFactory.createForClass(Languages);
