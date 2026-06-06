import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose, { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';
import { DeliveryAddress, MealType, PlanDuration, SubscripitionStatus } from '../dto/subscription.dto';

@Schema({ timestamps: true })
export class CustomerCreateSubscription {

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers', required: true })
    customer_id: string;  


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true })
    restaurant_id: string;    


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionItems', required: true })
    subscription_item_id: string;   

    @Prop({ enum: MealType, required: true })
    meal_type: MealType;

    @Prop({ type: Date, required: true })
    meal_time: Date;


    @Prop({ enum: PlanDuration, required: true })
    plan_duration: PlanDuration;

    @Prop()
    custom_note: string;

    @Prop({ required: true })
    price: number;    

    @Prop({ type: [String], default: [] })
    selected_days: string[];

    
    @Prop({ type: mongoose.Schema.Types.Mixed })
    delivery_address: DeliveryAddress;

    @Prop({type:String,enum:SubscripitionStatus,default:SubscripitionStatus.Active})
    status: SubscripitionStatus
    
    

}





export type SubscriptionCreateDocment = HydratedDocument<CustomerCreateSubscription>;
export const CustomerCreateSubscriptionModel = SchemaFactory.createForClass(CustomerCreateSubscription);