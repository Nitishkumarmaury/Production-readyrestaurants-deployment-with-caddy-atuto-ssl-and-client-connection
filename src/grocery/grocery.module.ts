import { Module } from '@nestjs/common';
import { GroceryController } from './grocery.controller';
import { GroceryService } from './grocery.service';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { PharmacyController } from './pharmacy.controller';
import { ClothController } from './cloth.controller';
import { ElectronicsController } from './electronics.controller';

@Module({
  imports:[RazorpayModule],
  controllers: [GroceryController, PharmacyController, ClothController, ElectronicsController],
  providers: [GroceryService]
})
export class GroceryModule {}
