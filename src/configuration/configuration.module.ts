import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { CommonService } from 'src/common/common.service';

@Module({
  imports : [RazorpayModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService, CommonService],
  exports:[ConfigurationService]
})
export class ConfigurationModule {}
