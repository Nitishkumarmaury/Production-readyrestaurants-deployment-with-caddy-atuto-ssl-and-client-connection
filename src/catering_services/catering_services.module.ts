import { Module } from '@nestjs/common';
import { CateringServicesController } from './catering_services.controller';
import { CateringServicesService } from './catering_services.service';
import { CateringServicesAggregation } from './catering_services.aggregation';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [RazorpayModule, PaymentModule],
  controllers: [CateringServicesController],
  providers: [CateringServicesService, CateringServicesAggregation]
})
export class CateringServicesModule {}
