import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from "mongoose";
import * as mongosse from "mongoose";

export enum CateringPlanStatus {
   Active = "active",
   NotActive = "not_active"
}

@Schema({ _id: false }) 
class PlanDetails {

    @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Category' }) 
    category_id: string;

    @Prop({ type: Number,  default: 0 })
    count:number
}
const PlanDetailsSchema = SchemaFactory.createForClass(PlanDetails);



@Schema({ timestamps: true })
export class CateringPlan {

    // @Prop({ type: mongosse.Schema.Types.ObjectId, ref: 'Vendor' }) 
    // vendor_id: string;


    @Prop({ type: String, default : null })
    name: string;


    @Prop({ type: Number,  default: 0 })
    kid_price: number;

    @Prop({ type: Number,  default: 0 })
    price: number;

    @Prop({ type: String, default : null })
    discription: string;

    @Prop({ type : String, enum: CateringPlanStatus, default: CateringPlanStatus.Active })
    status?: CateringPlanStatus;

    @Prop({ type : [PlanDetailsSchema], default: [] })
    plan_details:PlanDetails[]

    @Prop({ type: [mongosse.Schema.Types.ObjectId], ref: 'Restaurant', default: [] }) 
    not_available_restaurant_ids: string[];

}

export type CateringPlanDocment = HydratedDocument<CateringPlan>;
export const CateringPlanModel = SchemaFactory.createForClass(CateringPlan);


