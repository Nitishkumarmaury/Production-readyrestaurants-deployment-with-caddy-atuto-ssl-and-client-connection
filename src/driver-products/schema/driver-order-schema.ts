import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';

export enum DriverOrderStatus {
    placed = 'placed',
    delivered = 'delivered',
    cancelled = 'cancelled',
}




@Schema({ timestamps: true })
export class DriverOrders {

    @Prop({ default: null })
    order_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Drivers' })
    driver_id: string;
    
    @Prop({ type: Number, default: 0 })
    total_amount: number;
        
    @Prop({ type: String, default: null })
    currency: string;

    @Prop({ type: Object, default: null })
    address: object;

    @Prop({
    type: String,
    enum: DriverOrderStatus,
    default: null,
    })
    status: DriverOrderStatus

    @Prop({ 
        type: [mongosse.Schema.Types.ObjectId], 
        required: false,
        default : null, 
        ref: 'DriverItems'

    })
    items: mongosse.Schema.Types.ObjectId[];

    @Prop({ default: null })
    razorpay_order_id: string;
    
}

export type DriverOrdersDocment = HydratedDocument<DriverOrders>;
export const DriverOrdersModel = SchemaFactory.createForClass(DriverOrders);
