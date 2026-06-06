import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Stock{
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
    restaurant_id: string;
    
    @Prop({type:mongoose.Schema.Types.ObjectId,ref:'GroceryItems',required:true})
    grocery_id: string;
    
    @Prop({type:Number,default:0})
    total_stock: number

    @Prop({type:String,default:null})
    color_code: string

    @Prop({type:String,default:null})
    size: string

}



export type StockDocument = HydratedDocument<Stock>;
export const stockModel = SchemaFactory.createForClass(Stock);