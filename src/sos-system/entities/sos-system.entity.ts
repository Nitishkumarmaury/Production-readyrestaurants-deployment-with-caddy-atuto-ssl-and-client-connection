import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SosContactDocument = SosContact & Document;

@Schema({ timestamps: true })
export class SosContact {
    @Prop({ type: Types.ObjectId, required: true, ref: 'Driver' })
    driver_id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    phone_number: string;

    @Prop()
    relationship?: string;
}

export const SosContactSchema = SchemaFactory.createForClass(SosContact);
export const SosContactModel = SchemaFactory.createForClass(SosContact);

