import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Referral, ReferralSchema } from './entities/referral.entity';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { DbModule } from 'src/db/db.module';
import { CommonModule } from 'src/common/common.module';
import { ReferralUsage, ReferralUsageSchema } from './entities/referral-usage.entity';

@Module({
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule { }
