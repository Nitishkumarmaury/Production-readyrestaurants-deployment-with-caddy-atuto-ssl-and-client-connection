import { Module } from '@nestjs/common';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { FoodAggregation } from './food.aggregation';
import { EmbeddingModule } from 'src/embedding/embedding.module';

@Module({
  imports:[EmbeddingModule],
  controllers: [FoodController],
  providers: [FoodService,FoodAggregation],
})
export class FoodModule {}
