import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { RestaurantAggregation } from './restaurant.aggregation';
import { EmbeddingModule } from 'src/embedding/embedding.module';
import { SlotModule } from 'src/slot/slot.module';
import { AppService } from 'src/app.service';

@Module({
  imports:[EmbeddingModule, SlotModule],
  controllers: [RestaurantController],
  providers: [RestaurantService,RestaurantAggregation, AppService],
})
export class RestaurantModule {}
