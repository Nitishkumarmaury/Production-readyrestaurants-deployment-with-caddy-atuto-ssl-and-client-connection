import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionAggregation } from './subscription.aggregation';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionAggregation],
  exports: [SubscriptionsService]
})
export class SubscriptionsModule {}
