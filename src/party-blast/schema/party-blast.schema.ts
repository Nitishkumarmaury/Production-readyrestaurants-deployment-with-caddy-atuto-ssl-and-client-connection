import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";
import { AddAddress } from "src/order/schema/order.schema";

export enum FoodPreference {
  VEG = 'veg',
  NON_VEG = 'non_veg',
  MIXED = 'mixed',
}


@Schema({ timestamps: true })
export class PartyBlast {

    
    @Prop({ type: String, default: null })
    order_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Customers' }) 
    customer_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) 
    vendor_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Restaurant' }) 
    restaurant_id: string;

        
    @Prop({ type: String, required: false })
    name: string;


    @Prop({ type: AddAddress, default: null })
    address: AddAddress;

    @Prop({ type: String, required: false })
    phone: string;

    @Prop({ type: String, required: false })
    email: string;

    @Prop({ type: String, required: false })
    event_type: string;

    @Prop({ type: Number, required: false })
    no_of_guest: number;

    @Prop({ type: Date, required: false })
    event_time: Date;

    @Prop({ type: String, default: null })
    additional_request?: string;

    @Prop({ type: String, enum: FoodPreference, required: false })
    food_preferences: FoodPreference;
    


}

export type PartyBlastDocment = HydratedDocument<PartyBlast>;
export const PartyBlastModel = SchemaFactory.createForClass(PartyBlast);



