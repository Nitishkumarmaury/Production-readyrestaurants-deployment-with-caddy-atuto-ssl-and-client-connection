import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongosse from 'mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
export enum referralType {
    CUSTOMER = "CUSTOMER",
    DRIVER = "DRIVER"
}
export type ReferralDocument = Referral & Document;

@Schema()
export class Referral {
    @Prop({ default: referralType.CUSTOMER, enum: referralType })
    type: string;

    @Prop({ default: 0 })
    cus_ref_amount: number;

    @Prop({ default: 0 })
    driver_ref_amount: number;

    @Prop({ default: 0 })
    cus_order_count: number;

    @Prop({ default: 0 })
    driver_ref_cond_no: number;

    @Prop({ default: 0 })
    no_of_days_for_cus: number;

    @Prop({ default: 0 })
    no_of_days_for_driver: number;

    @Prop({ default: false })
    is_active: boolean;

    @Prop({ default: 0 })
    camp_code: number;

    @Prop({ type: Number, default: moment.utc().valueOf() })
    created_at: number;

    @Prop({ type: Number, default: null })
    updated_at: number;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);
export const ReferralModel = SchemaFactory.createForClass(Referral);
