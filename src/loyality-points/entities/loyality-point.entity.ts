import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoyaltySettingsDocument = LoyaltySettings & Document;

@Schema({ timestamps: true })
export class LoyaltySettings {
    @Prop({ type: Number, required: true })
    points_per_order: number;

    @Prop({ type: Number, required: false, default: 0 })
    min_order_amount: number;

    @Prop({ type: Number, required: false, default: 180 })
    points_expiry_days: number;

    @Prop({ type: Boolean, default: true })
    is_active: boolean;
}

export const LoyaltySettingsSchema = SchemaFactory.createForClass(LoyaltySettings);
export const loyaltySettingsModel = SchemaFactory.createForClass(LoyaltySettings);
