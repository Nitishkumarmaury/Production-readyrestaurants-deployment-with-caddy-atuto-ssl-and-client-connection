import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";
import { AddAddress, PaymentStatus } from "src/order/schema/order.schema";

export enum DealBuyStatus {
    Placed = "placed",
    Accepted = "accepted",
    Canceled = "canceled",
    Delivered = "delivered",
    Refunded = "refunded",
}

@Schema({ timestamps: true })
export class DealBuy {

    @Prop({ type: String, default: null })
    order_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers' }) 
    customer_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) 
    vendor_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Restaurant' }) 
    restaurant_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Deals' }) 
    deal_id: string;

    @Prop({ type: String, default : null })
    notes: string;

    @Prop({ type: AddAddress, default: null })
    delivery_address: AddAddress;

    @Prop({ type: Date, default : null })
    scheduled_time: Date;

    @Prop({ type : String, enum: DealBuyStatus, default: null })
    status?: DealBuyStatus;

    @Prop({ type: Number, default : 0 })
    amount: number;

    @Prop({ type: Number, default : 0 })
    tax: number;

    @Prop({ type: Number, default : 0 })
    platform_fee: number;

    @Prop({ type: Number, default : 0 })
    total_amount: number;

    
    @Prop({ type : String, enum: PaymentStatus, default: null })
    payment_status?: PaymentStatus;

    @Prop({ type: String, default : null })
    razorpay_order_id: string;


    @Prop({ type: String, default : null })
    razorpay_payment_id: string;


    @Prop({ type: String, default : null })
    stripe_payment_id: string;


    @Prop({ type: String, default: null })
    refund_id: string;
 
    @Prop({ type: Number, default: null })
    refund_amount: number;

    @Prop({ type: Number, default: null })
    refund_at: number;
}

export type DealBuyDocment = HydratedDocument<DealBuy>;
export const DealBuyModel = SchemaFactory.createForClass(DealBuy);


