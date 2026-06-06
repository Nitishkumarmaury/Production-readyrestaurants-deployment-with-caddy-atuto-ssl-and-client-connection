import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

export enum CustomerBookingStatus {
    Unpaid ="unpaid",
    Paid = 'paid',
    MarkAsArrived = "arrived",
    Cancel = "cancel",
    Refunded = "Refunded"
}

@Schema({ timestamps: true })
export class CustomerSlot {


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Customers", default : null })
    customer_id: string;


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Slot", default : null })
    slot_id: string;
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" })
    restaurant_id: string;

    
    @Prop({ type: String, default: null })
    booking_id: string;


    @Prop({ type: Number, default: 0 })
    no_of_guest: number;

    
    @Prop({ type: String, default: null })
    special_request: string;

    @Prop({ type: String, default: null })
    occasion_type: string;



    @Prop({ type: Number, default: 0 })
    total_booking_amount: number;



    @Prop({ enum: CustomerBookingStatus, default: CustomerBookingStatus.Unpaid })
    status: CustomerBookingStatus;


    @Prop({ type: String, default: null })
    razorpay_order_id: string;

    @Prop({ type: String, default: null })
    razorpay_payment_id: string;

    @Prop({ type: String, default: null })
    refund_id: string;

    @Prop({ type: String, default: null })
    stripe_payment_id: string;

 
    @Prop({ type: Number, default: null })
    refund_amount: number;

    @Prop({ type: Number, default: null })
    refund_at: number;


}

export type CustomerSlotDocment = HydratedDocument<CustomerSlot>;
export const CustomerSlotModel = SchemaFactory.createForClass(CustomerSlot);

