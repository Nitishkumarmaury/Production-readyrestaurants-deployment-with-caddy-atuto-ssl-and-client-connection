import { Module } from '@nestjs/common';
import { QuickPicksService } from './quick_picks.service';

@Module({
  controllers: [],
  providers: [QuickPicksService]
})
export class QuickPicksModule {}
