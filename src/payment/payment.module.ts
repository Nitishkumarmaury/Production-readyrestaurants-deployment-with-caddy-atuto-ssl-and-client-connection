import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';

@Module({
  imports: [
    LoyalityPointsModule, 
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports : [PaymentService]

})
export class PaymentModule { }
