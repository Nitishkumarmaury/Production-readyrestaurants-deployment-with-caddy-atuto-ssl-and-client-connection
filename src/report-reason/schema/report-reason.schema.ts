import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as moment from 'moment';
import { HydratedDocument } from 'mongoose';
import * as mongosse from 'mongoose';
import { ReportType } from '../dto/report-reason.dto';

@Schema({ timestamps: true })
export class ReportReason {

    @Prop({ type: String, default: null })
    reason: string;
    
    @Prop({ enum: ReportType, default: null })
    type: ReportType;
}

export type ReportReasonDocment = HydratedDocument<ReportReason>;
export const ReportReasonModel = SchemaFactory.createForClass(ReportReason);

