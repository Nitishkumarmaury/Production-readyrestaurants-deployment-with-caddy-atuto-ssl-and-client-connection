import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';


@Schema({ timestamps: true })
export class DriverProducts {

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

    @Prop({ type: Array, default: null })
    size: string[];

}

export type DriverProductsDocment = HydratedDocument<DriverProducts>;
export const DriverProductsModel = SchemaFactory.createForClass(DriverProducts);
