import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { VendorService } from 'src/vendor/vendor.service';
import { EarningService } from 'src/earning/earning.service';
import { SlotService } from 'src/slot/slot.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { JobsService } from 'src/jobs/jobs.service';


@Module({
  providers: [CronjobService,VendorService,EarningService, SlotService,SubscriptionsService, 
    JobsService]
})
export class CronjobModule {}
