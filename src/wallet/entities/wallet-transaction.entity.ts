import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose, { Document, Types } from 'mongoose';
import { Customers } from 'src/customer/schema/customer.schema';

export type WalletTransactionDocument = WalletTransaction & Document;

export enum WalletTxnType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT'
}

export enum WalletTxnCreditType {
    Point = 'point',
    Referral = 'referral'
}

export enum DebitType {
    ORDER = 'ORDER',
    WITHDRAWAL = 'WITHDRAWAL',
    REFUND = 'REFUND'
}

@Schema({ timestamps: true })
export class WalletTransaction extends Document {
    @Prop({ type: Types.ObjectId, ref: Customers.name, required: false, default: null, index: false })
    customer_id: Types.ObjectId | null;

    @Prop({ type: String, enum: WalletTxnType })
    type: WalletTxnType;

    @Prop({ type: String, enum: WalletTxnCreditType })
    credit_type: WalletTxnCreditType;

    
    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: Boolean, default: false })
    is_refund: boolean;

    @Prop({ type: String, default: "", required: false })
    stripe_payment_intent: string;

    @Prop({ type: String, default: null })
    tx_id: string;

    // Only needed for DEBIT
    @Prop({ type: String, enum: DebitType, default: null })
    debit_type: DebitType;

    @Prop({ type: Types.ObjectId, ref: 'Orders', default: null })
    order_id: Types.ObjectId;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

export const WalletTransactionUsageModel = SchemaFactory.createForClass(WalletTransaction);


