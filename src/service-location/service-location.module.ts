import { Module } from '@nestjs/common';
import { ServiceLocationController } from './service-location.controller';
import { ServiceLocationService } from './service-location.service';

@Module({
  controllers: [ServiceLocationController],
  providers: [ServiceLocationService]
})
export class ServiceLocationModule {}
