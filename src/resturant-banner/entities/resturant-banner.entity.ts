import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Restaurant } from 'src/restaurant/schema/restaurant.schema';

export type RestaurantBannerDocument = RestaurantBanner & Document;


export enum BannerType {

    Restaurant = "restaurant",
    Admin = "admin",

    Grocery = "grocery",
    Pharmacy = "pharmacy",
    Electronics = "electronics",
    Cloth = "cloth"
}

@Schema({ timestamps: true })
export class RestaurantBanner {

    @Prop({ type: String, enum: BannerType, default: BannerType.Admin })
    type: BannerType;
    
    @Prop({ type: Types.ObjectId, ref: Restaurant.name, required: false })
    restaurant_id: Types.ObjectId;

    @Prop({ required: true })
    banner_url: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: Date, default: null })
    start_date: Date;

    @Prop({ type: Date, default: null })
    end_date: Date;

    @Prop({ default: true })
    is_active: boolean;
}

export const RestaurantBannerSchema = SchemaFactory.createForClass(RestaurantBanner);
export const RestaurantBannerModel = SchemaFactory.createForClass(RestaurantBanner);

