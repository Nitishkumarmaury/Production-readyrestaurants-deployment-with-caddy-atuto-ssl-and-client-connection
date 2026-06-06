import { Module } from '@nestjs/common';
import { PartyBlastController } from './party-blast.controller';
import { PartyBlastService } from './party-blast.service';

@Module({
  controllers: [PartyBlastController],
  providers: [PartyBlastService]
})
export class PartyBlastModule {}
