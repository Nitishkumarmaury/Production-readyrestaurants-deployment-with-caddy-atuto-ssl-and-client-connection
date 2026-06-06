import { Module } from '@nestjs/common';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [RazorpayModule, PaymentModule],
  controllers: [DealController],
  providers: [DealService]
})
export class DealModule {}
