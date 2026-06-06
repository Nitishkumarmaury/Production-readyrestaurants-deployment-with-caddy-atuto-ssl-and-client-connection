import { Module } from '@nestjs/common';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports : [RazorpayModule, PaymentModule ],
  controllers: [SlotController],
  providers: [SlotService],
  exports: [SlotService]
})
export class SlotModule {}
