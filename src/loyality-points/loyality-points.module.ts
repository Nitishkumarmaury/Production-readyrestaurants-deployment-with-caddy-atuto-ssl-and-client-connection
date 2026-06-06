import { Module } from '@nestjs/common';
import { LoyalityPointsService } from './loyality-points.service';
import { LoyalityPointsController } from './loyality-points.controller';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  imports : [CustomerModule],
  controllers: [LoyalityPointsController],
  providers: [LoyalityPointsService],
  exports: [LoyalityPointsService],
})
export class LoyalityPointsModule { }
