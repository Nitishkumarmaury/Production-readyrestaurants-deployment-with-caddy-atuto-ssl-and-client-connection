import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Customers } from "src/customer/schema/customer.schema";

export type LoyaltyWalletDocument = LoyaltyWallet & Document;

@Schema({ timestamps: true })
export class LoyaltyWallet {
    @Prop({ type: Types.ObjectId, ref: Customers.name, required: true, index: true })
    customer_id: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    balance: number;
}
export const LoyaltyWalletSchema = SchemaFactory.createForClass(LoyaltyWallet);

export const LoyaltyWalletModel = SchemaFactory.createForClass(LoyaltyWallet);