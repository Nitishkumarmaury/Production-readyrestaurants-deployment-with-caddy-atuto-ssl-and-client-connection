import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Cart {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true })
    customer_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GroceryItems', required: true })
    grocery_id: string;

    @Prop({type:mongoose.Schema.Types.ObjectId,ref:'Restaurant',required:true})
    restaurant_id: string

    @Prop({ required: true })
    price: number; 

    @Prop({ required: true })
    quantity: number;

    @Prop({default:null})
    unit: string;

    @Prop({ required: true })
    total_price: number; 

    @Prop({ type: Boolean, default: false })
    is_ordered: boolean

    @Prop({ type: String, default: null })
    imageUrl: string;
}

export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);
