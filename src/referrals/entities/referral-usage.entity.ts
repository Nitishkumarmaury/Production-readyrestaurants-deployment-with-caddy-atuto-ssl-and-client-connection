import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { Customers } from 'src/customer/schema/customer.schema';
import { Referral } from './referral.entity';

export enum ReferralStatus {
    PENDING = 'PENDING',
    REWARDED = 'REWARDED',
    EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class ReferralUsage {
    @Prop({ type: Types.ObjectId, ref: Customers.name, required: true })
    referredUser: Types.ObjectId; // The user who applied the referral code

    @Prop({ type: Types.ObjectId, ref: Customers.name, default: null })
    referrerUser: Types.ObjectId; // The user who shared the referral code (optional)

    @Prop({ type: Types.ObjectId, ref: Referral.name, required: true })
    campaignId: Types.ObjectId;

    @Prop({ required: true })
    referralCode: string; // The referral code that was applied

    @Prop({ default: 0 })
    successfulBookings: number;

    @Prop({ enum: ReferralStatus, default: ReferralStatus.PENDING })
    status: ReferralStatus;

    @Prop({ default: false })
    isBonusCredited: boolean;
}

export type ReferralUsageDocument = ReferralUsage & Document;
export const ReferralUsageSchema = SchemaFactory.createForClass(ReferralUsage);
export const ReferralUsageModel = SchemaFactory.createForClass(ReferralUsage);
