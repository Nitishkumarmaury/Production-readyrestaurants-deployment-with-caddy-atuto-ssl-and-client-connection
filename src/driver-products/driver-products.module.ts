import { Module } from '@nestjs/common';
import { DriverProductsController } from './driver-products.controller';
import { DriverProductsService } from './driver-products.service';
import { RazorpayModule } from 'src/razorpay/razorpay.module';

@Module({
  imports : [RazorpayModule],
  controllers: [DriverProductsController],
  providers: [DriverProductsService]
})
export class DriverProductsModule {}
