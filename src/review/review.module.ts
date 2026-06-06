import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewAggregation } from './review.aggregation';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService,ReviewAggregation],
})
export class ReviewModule {}
