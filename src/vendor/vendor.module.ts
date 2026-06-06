import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { OrderService } from 'src/order/order.service';
import { VendorAggregation } from './vendor.aggregation';
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';
import { SocketModule } from 'src/socket/socket.module';


@Module({
  imports: [
    LoyalityPointsModule,
    SocketModule,
  ],
  controllers: [VendorController],
  providers: [VendorService, VendorAggregation],
  exports: [VendorService]
})
export class VendorModule { }
