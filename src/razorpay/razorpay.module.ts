import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { PaymentModule } from 'src/payment/payment.module';

@Module({

  imports : [PaymentModule],
  controllers: [RazorpayController],
  providers: [RazorpayService],
  exports: [RazorpayService]
})
export class RazorpayModule {}
