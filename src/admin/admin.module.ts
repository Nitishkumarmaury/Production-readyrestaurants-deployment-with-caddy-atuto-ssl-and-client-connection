import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAggregation } from './admin.aggregation';

@Module({
  controllers: [AdminController],
  providers: [AdminService,AdminAggregation],
  exports:[AdminService]
})
export class AdminModule {}
