import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose, { Document, Types } from 'mongoose';
import { Customers } from 'src/customer/schema/customer.schema';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet extends Document {
    @Prop({ type: Types.ObjectId, ref: Customers.name, required: false, default: null, index: false })
    customer_id: Types.ObjectId | null;

    @Prop({ type: Number, default: 0 })
    balance: number;

    @Prop({ type: Number, default: 0 })
    refund_balance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

export const WalletModel = SchemaFactory.createForClass(Wallet);


