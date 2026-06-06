import { Module } from '@nestjs/common';
import { ReportReasonController } from './report-reason.controller';
import { ReportReasonService } from './report-reason.service';

@Module({
  controllers: [ReportReasonController],
  providers: [ReportReasonService]
})
export class ReportReasonModule {}
