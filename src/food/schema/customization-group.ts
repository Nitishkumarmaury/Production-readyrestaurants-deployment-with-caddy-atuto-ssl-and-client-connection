import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";



@Schema()
export class CustomizationGroups {
    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Restaurant" }) // Add reference to Vehicle schema
    restaurant_id: string;

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: "Vendor" }) // Add reference to Vehicle schema
    vendor_id: string;

    @Prop({ default: null })
    group_title: string;

    @Prop({ default: null })
    group_description: string;

    @Prop({ type: Number, default: moment.utc().valueOf() })
    created_at: number;

    @Prop({ type: Number, default: null })
    updated_at: number;
}

export type CustomizationGroupsDocument = HydratedDocument<CustomizationGroups>;
export const CustomizationGroupsModel = SchemaFactory.createForClass(CustomizationGroups);
