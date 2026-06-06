import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { GroceryOrderStatus, OrderStatus, PaymentStatus, PaymentType } from "../dto/grocery.dto";
import { GroceryItems } from "./grocery.schema";
import { AddAddress } from "src/order/schema/order.schema";
import { OrderDeliver } from "src/order/dto/order.dto";




@Schema({ timestamps: true })
export class GroceryOrder {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true })
    customer_id: string;// ---

    @Prop({type:mongoose.Schema.Types.ObjectId,ref:'Restaurant',required:true})
    restaurant_id: string;//--

    @Prop({ type: [GroceryItems], default: [] })
    cart_items: GroceryItems[];//--

     @Prop({ type: AddAddress, default: null })
    delivery_address: AddAddress; //--
    
    @Prop({ default: null })
    add_delivery_instruction: string;//--


    @Prop({ type: String, enum: GroceryOrderStatus, default: GroceryOrderStatus.Pending })
    order_status: GroceryOrderStatus;//--
    
  
    
    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
    payment_status: PaymentStatus;
    
    @Prop({ default: null })
    order_placed_at: number;

    @Prop({ default: null })
    order_id: string;


    @Prop({ type: Number,required: true })
    total_amount: number;

    @Prop({ type: Number, required: true })
    cart_amount: number;

    @Prop({ type: Number, required: true })
    tax_amount: number;

    @Prop({ default: 0 })
    delivery_fee: number;

    @Prop({type: Number, required: true })
    platform_fee: number;

    @Prop({ default: null })
    delivery_otp: string;

    @Prop({
        required: false,
        enum: OrderDeliver,
        default: OrderDeliver.Driver
        })
    deliver_type: OrderDeliver;

    @Prop({ default: null })
    razorpay_order_id: string;

    @Prop({ default: null })
    payment_intent: string;


}

export type GroceryOrderDocument = HydratedDocument<GroceryOrder>;
export const GroceryOrderSchema = SchemaFactory.createForClass(GroceryOrder);
