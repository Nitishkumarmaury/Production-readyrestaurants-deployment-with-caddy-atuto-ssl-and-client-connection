import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument, Types } from "mongoose";
import * as mongoose from "mongoose";
import { OrderDeliver, OrderSubscriptionStatus, OrderSubscriptionType } from "../dto/order.dto";
import { AddAddress, FoodItem, GuestDetail, OrderStatus, OrderType, PaymentStatus, PaymentType, ReceiverDetail, RiderStatus } from "./order.schema";

// Define the main SubscribeOrder schema
@Schema({ timestamps: true })
export class SubscribeOrder {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" })
    restaurant_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Customers" })
    customer_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Drivers", default: null })
    driver_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null })
    coupon_id: string;

    @Prop({ default: null })
    order_id: string;

    @Prop({ type: [FoodItem], default: [] })
    cart_items: FoodItem[];

    @Prop({ type: AddAddress, default: null })
    delivery_address: AddAddress;

    @Prop({ default: null })
    note_for_restaurant: string;

    @Prop({ default: null })
    add_delivery_instruction: string;

    @Prop({ type: ReceiverDetail, default: null })
    add_receiver_detail: ReceiverDetail

    @Prop({ type: GuestDetail, default: null })
    add_guest_detail: GuestDetail

    @Prop({ type: String, enum: OrderType, default: OrderType.Current })
    order_type: OrderType;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.OrderPlaced })
    order_status: OrderStatus;

    @Prop({ type: String, enum: RiderStatus, default: null })
    rider_status: RiderStatus;

    @Prop({ type: String, enum: PaymentType })
    payment_type: PaymentType;

    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
    payment_status: PaymentStatus;

    @Prop({ type: Number, default: null })
    more_time_required_at: number;

    @Prop({ type: Number, default: null })
    add_more_time: number;

    @Prop({ default: null })
    order_placed_at: number;

    @Prop({ default: null })
    order_confirmed_at: number;

    @Prop({ default: null })
    order_prepared_at: number;

    @Prop({ default: null })
    order_ready_at: number;

    @Prop({ default: null })
    order_picked_up_at: number;

    @Prop({ default: null })
    order_delivered_at: number;

    @Prop({ default: null })
    order_count_for_restaurant: number;

    @Prop({ default: null })
    estimated_food_ready_time: number;

    @Prop({ default: null })
    estimated_delivery_time: number;

    @Prop({ default: null })
    distance: number;

    @Prop({ default: null })
    cart_amount: number;

    @Prop({ default: null })
    restaurant_rating: number;

    @Prop({ default: null })
    driver_rating: number;

    @Prop({ default: null })
    coupon_amount: number;

    @Prop({ default: null })
    delivery_fee: number;

    @Prop({ default: null })
    platform_fee: number;

    @Prop({ default: null })
    tax_amount: number;

    @Prop({ default: null })
    total_amount: number;

    @Prop({ default: null })
    delivered_at: number;

    @Prop({ type: Date, default: null })
    refund_at: Date;

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Drivers', default: [] })
    order_open_for: mongoose.Schema.Types.ObjectId[];

    @Prop({ default: null })
    delivery_otp: string;

    @Prop({ default: null })
    otp_sent_at: number;

    @Prop({ default: null })
    tip_amount: number;

    @Prop({ type: Date, default: null })
    scheduled_time: Date;

    @Prop({ default: null })
    is_open_for_driver: boolean;


    @Prop({ default: null })
    razorpay_order_id: string;

    @Prop({ type: Number, default: moment.utc().valueOf() })
    created_at: number;

    @Prop({ type: Number, default: null })
    updated_at: number;

    @Prop({
    required: false,
    enum: OrderDeliver,
    default: OrderDeliver.Driver
    })
    deliver_type: OrderDeliver;


    
    
    @Prop({
    required: false,
    enum: OrderSubscriptionType,
    default: null
    })
    subscription_type: OrderSubscriptionType;

    @Prop({ type: [Number], default: null })
    subscription_monthly: number[];

    @Prop({ type: [String], default: null })
    subscription_weekly: string[];

    @Prop({ type: Date, default: null })
    order_time: Date;

    @Prop({ type: Number, default: 0 })
    order_time_in_minutes: number;

    @Prop({
    required: false,
    enum: OrderSubscriptionStatus,
    default: OrderSubscriptionStatus.Active
    })
    subscription_status: OrderSubscriptionStatus;

}

// Create the SubscribeOrder document and model
export type SubscribeOrderDocument = HydratedDocument<SubscribeOrder>;
export const SubscribeOrderModel = SchemaFactory.createForClass(SubscribeOrder);










