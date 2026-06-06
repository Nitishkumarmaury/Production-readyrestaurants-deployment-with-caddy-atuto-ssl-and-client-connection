import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { DeliveryAddress, MealType, OrderSubscripitionStatus } from "../dto/subscription.dto";


@Schema({ timestamps: true })
export class OrderSubscripition {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Customers", required: true })
    customer_id: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref:"Restaurant",required:true})
    restaurant_id: string
    

    @Prop({type:mongoose.Schema.Types.ObjectId,ref:"SubscriptionItems",required:true})
    subscription_item_id: string
    

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CustomerCreateSubscription", required: true })
    customer_subscription_id: string           // id for reltion between the subscripitionorder and customer create subscription ak... 

    @Prop({ default: null })
    order_id: string;
   

    @Prop({ type: mongoose.Schema.Types.Mixed })
    delivery_address: DeliveryAddress;


    @Prop({ required: true })
    price: number;  

     @Prop({ enum: MealType, required: true })
    meal_type: MealType;
    
    @Prop({ type: Date, required: true })
    meal_time: Date;

    @Prop({ type: String, enum: OrderSubscripitionStatus,default:OrderSubscripitionStatus.Upcomming})
    status: OrderSubscripitionStatus


    
    @Prop({ type: Date, default: null })
    processing_started_at?: Date;


    @Prop({ type: Date, default: null })
    placed_at?: Date;

    @Prop({ type: Boolean, default: null })
    low_Balance: boolean;
       
}






export type OrderSubscripitionDocument =
    HydratedDocument<OrderSubscripition>;

export const OrderSubscripitionModel =
    SchemaFactory.createForClass(OrderSubscripition);
