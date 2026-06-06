import { Module } from '@nestjs/common';
import { SosSystemService } from './sos-system.service';
import { SosSystemController } from './sos-system.controller';

@Module({
  controllers: [SosSystemController],
  providers: [SosSystemService],
})
export class SosSystemModule {}
