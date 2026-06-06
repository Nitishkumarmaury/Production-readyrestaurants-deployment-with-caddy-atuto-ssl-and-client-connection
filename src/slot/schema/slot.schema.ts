import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';


export enum SlotStatus {
    NotBooked = 'NotBooked',
    Booked ="Booked",
}

@Schema({ timestamps: true })
export class Slot {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" })
    restaurant_id: string;

    @Prop({ type: Date, default: null })
    start: Date;

    @Prop({ type: Date, default: null })
    end: Date;

    @Prop({ type: Number, default: 0 })
    maximum_capacity_slot: number;

    @Prop({ enum: SlotStatus, default: SlotStatus.NotBooked })
    status: SlotStatus;

}

export type SlotDocment = HydratedDocument<Slot>;
export const SlotModel = SchemaFactory.createForClass(Slot);

