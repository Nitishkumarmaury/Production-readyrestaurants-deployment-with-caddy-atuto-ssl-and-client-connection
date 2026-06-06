import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Customers } from 'src/customer/schema/customer.schema';
import { Orders } from 'src/order/schema/order.schema';

export enum LoyaltyPointType {
    EARNED = 'earned',
    REDEEMED = 'redeemed',
    EXPIRED = 'expired',
}

export type LoyaltyHistoryDocument = LoyaltyHistory & Document;

@Schema({ timestamps: true })
export class LoyaltyHistory {
    @Prop({ type: Types.ObjectId, ref: Customers.name, required: true, index: true })
    customer_id: Types.ObjectId;

    @Prop({ type: Number, required: true })
    points: number;

    @Prop({ type: String, enum: Object.values(LoyaltyPointType), required: true })
    type: LoyaltyPointType;

    @Prop({ type: Types.ObjectId, ref: Orders.name, required: false })
    order_id?: Types.ObjectId;

    @Prop({ type: Date, default: null })
    expiry_date?: Date;

    @Prop({ type: String, default: '' })
    remarks?: string;
}

export const LoyaltyHistorySchema = SchemaFactory.createForClass(LoyaltyHistory);
export const loyaltyHistoryModel = SchemaFactory.createForClass(LoyaltyHistory);

LoyaltyHistorySchema.index({ customer_id: 1 });
LoyaltyHistorySchema.index({ order_id: 1 });
