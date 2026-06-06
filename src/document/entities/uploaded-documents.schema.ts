import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { DocumentRequirement } from './document.entity';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';
import { Drivers } from 'src/driver/schema/driver.schema';

export type UplodedDocumentDocument = UplodedDocument & Document;

@Schema({ timestamps: true })
export class UplodedDocument {
    @Prop({ type: Types.ObjectId, ref: DocumentRequirement.name, required: true })
    requirement_id: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Restaurant.name, required: false })
    restaurant_id: Types.ObjectId| null;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Drivers.name, required: false })
    driver_id: Types.ObjectId| null;

    @Prop({ type: String, required: true, enum: ['driver', 'restaurant'] })
    entity_type: string;

    @Prop({ type: String, default: null })
    document_value: string;

    @Prop({ type: String, default: null })
    document_value_back: string;

    // If response_type = image/pdf → store URL
    // If number/text → store value directly

    @Prop({ type: Number, default: null })
    expiry_date: number; // if applicable

    // @Prop({ type: String, enum: ['success', 'rejected', 'pending'], default: 'pending' })
    // status: string;
}

export const UplodedDocumentSchema = SchemaFactory.createForClass(UplodedDocument);
export const UplodedDocumentModel = SchemaFactory.createForClass(UplodedDocument);
