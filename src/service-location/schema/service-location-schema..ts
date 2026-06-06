import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';
import { LocationStatus } from '../dto/service-location.dto';

export type ServiceLocationDocument = ServiceLocation & Document;

@Schema({ timestamps: true })
export class ServiceLocation {

    @Prop({ required: false })
    name: String;

    @Prop({ required: false })
    latitude: Number;

    @Prop({ required: false })
    longitude: Number;

    @Prop({ required: false })
    serviceRadius: Number;

    @Prop({ enum: LocationStatus, default: LocationStatus.ACTIVE })
    status?: string;

    @Prop({ type : Boolean,  default: true })
    is_global: Boolean;

    @Prop({
        type: [[Number]],
        required: true,
    })
    polygon_coordinates: number[][];
}

export const ServiceLocationSchema = SchemaFactory.createForClass(ServiceLocation);
export const ServiceLocationModel = SchemaFactory.createForClass(ServiceLocation);