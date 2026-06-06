import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DocumentType  {
  Driver ='driver',
  Restaurant = 'restaurant',
}


export enum DocumentResponseType  {
  Image ='image',
  Number = 'number',
  BothSideImage = 'both_side_image'
}


export type DocumentRequirementDocument = DocumentRequirement & Document;

@Schema({ timestamps: true })
export class DocumentRequirement {

  @Prop({ required: true, enum: DocumentType })
  type: string; // who needs it

  @Prop({ required: true, enum: DocumentResponseType })
  response_type: string;

  @Prop({ required: true })
  document_name: string; // e.g. "Driver License", "Pollution Certificate"

  @Prop({ default: false })
  is_required: boolean;

  @Prop({ default: false })
  is_expiry: boolean;
}

export const DocumentRequirementSchema = SchemaFactory.createForClass(DocumentRequirement);
export const DocumentRequirementModel = SchemaFactory.createForClass(DocumentRequirement);
