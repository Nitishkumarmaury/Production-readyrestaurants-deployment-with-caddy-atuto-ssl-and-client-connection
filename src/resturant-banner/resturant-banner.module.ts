import { Module } from '@nestjs/common';
import { ResturantBannerService } from './resturant-banner.service';
import { ResturantBannerController } from './resturant-banner.controller';

@Module({
  controllers: [ResturantBannerController],
  providers: [ResturantBannerService],
})
export class ResturantBannerModule {}
