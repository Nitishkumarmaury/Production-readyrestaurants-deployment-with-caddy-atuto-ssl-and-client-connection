import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';



@Schema({ timestamps: true })
export class DriverItems {

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Drivers' })
    driver_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'DriverOrders' })
    driver_order_id: string;

    @Prop({ type: Number, default: 0 })
    quantity: number;

    @Prop({ type: String, default: null })
    title: string;

    @Prop({ type: Number, default: 0 })
    price: number;
    
    @Prop({ type: String, default: null })
    currency: string;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: String, default: null })
    image: string;

    @Prop({ type: String, default: null })
    size: string;
    
}

export type DriverItemsDocment = HydratedDocument<DriverItems>;
export const DriverItemsModel = SchemaFactory.createForClass(DriverItems);
