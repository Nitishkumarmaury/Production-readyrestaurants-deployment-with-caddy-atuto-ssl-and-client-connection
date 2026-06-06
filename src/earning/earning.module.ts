import { Module } from '@nestjs/common';
import { EarningService } from './earning.service';
import { EarningController } from './earning.controller';
import { EarningsAggregation } from './earning.aggregation';
import { AppService } from 'src/app.service';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { RazorpayModule } from 'src/razorpay/razorpay.module';

@Module({
  imports : [RazorpayModule],
  controllers: [EarningController],
  providers: [EarningService,EarningsAggregation,AppService],
  exports:[EarningService]
})
export class EarningModule {}
