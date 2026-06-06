import { Module } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { FavouriteController } from './favourite.controller';
import { FavouriteAggregation } from './favourite.aggregation';

@Module({
  controllers: [FavouriteController],
  providers: [FavouriteService,FavouriteAggregation],
})
export class FavouriteModule {}
