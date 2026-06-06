import { Module, forwardRef } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { DriverAggregation } from './driver.aggregation';
import { CustomerAggregation } from 'src/customer/customer.aggregation';
import { DiverSocket } from "./driver.socket";
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';
import { VendorModule } from 'src/vendor/vendor.module';

@Module({
  imports: [
    LoyalityPointsModule,
    forwardRef(() => VendorModule),
  ],
  controllers: [DriverController],
  providers: [DriverService, DriverAggregation, CustomerAggregation, DiverSocket],
  exports: [DriverService, DiverSocket]
})
export class DriverModule { }
