import { Global, Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderAggregation } from './order.aggregation';
import { PaymentService } from 'src/payment/payment.service';
import { AppService } from 'src/app.service';
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
@Global()
@Module({
  imports: [
    LoyalityPointsModule, RazorpayModule
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderAggregation, PaymentService, AppService],
  exports: [OrderService]
})
export class OrderModule { }
