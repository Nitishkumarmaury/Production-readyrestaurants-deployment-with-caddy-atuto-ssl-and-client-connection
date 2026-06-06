import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { CustomerAggregation } from './customer.aggregation';


@Module({
  controllers: [CustomerController],
  providers: [CustomerService,CustomerAggregation],
  exports: [CustomerService]
})
export class CustomerModule {}
