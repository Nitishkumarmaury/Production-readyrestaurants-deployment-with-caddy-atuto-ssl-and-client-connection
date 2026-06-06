import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";
import { AddAddress } from "src/order/schema/order.schema";


export enum PlatePaymentStatus {
    Partial_Payment_Done = "partial_payment_done",
    Full_Payment_Done = "full_payment_done"
}


export enum PlateStatus {

    Requested = "requested",
    Accepted = "accepted",
    Canceled = "canceled",
    Completed = "completed",
    Refunded = "refunded",
    
}

@Schema({ _id: false }) 
class MenuDetail {

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Category' }) 
    category_id: string;
    
    @Prop([{ type: mongosse.Schema.Types.ObjectId, ref: 'FoodItems' }]) 
    food_ids :string[]

}
const MenuDetailSchema = SchemaFactory.createForClass(MenuDetail);





@Schema({ timestamps: true })
export class Plate {


    
    @Prop({ type: String, default: null })
    order_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers' }) 
    customer_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) 
    vendor_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Restaurant' }) 
    restaurant_id: string;


    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'CateringPlan' }) 
    catering_plan_id: string;

    @Prop({ type : [MenuDetailSchema], default: [] })
    menu:MenuDetail[]
    
    @Prop({ type: Number, default : 0 })
    no_of_adults: number;
    
    @Prop({ type: Number, default : 0 })
    no_of_kids: number;

    @Prop({ type: String, default : null })
    notes: string;

    @Prop({ type: AddAddress, default: null })
    delivery_address: AddAddress;

    @Prop({ type: Date, default : null })
    scheduled_time: Date;

    @Prop({ type : String, enum: PlateStatus, default: null })
    status?: PlateStatus;


    @Prop({ type: Number, default : 0 })
    booking_amount: number;

    @Prop({ type: Number, default : 0 })
    tax: number;

    @Prop({ type: Number, default : 0 })
    platform_fee: number;


    @Prop({ type: Number, default : 0 })
    total_payment: number;

    @Prop({ type: Number, default : 0 })
    advance_payment: number;

    @Prop({ type : String, enum: PlatePaymentStatus, default: null })
    payment_status?: PlatePaymentStatus;

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

export type PlateDocment = HydratedDocument<Plate>;
export const PlateModel = SchemaFactory.createForClass(Plate);


