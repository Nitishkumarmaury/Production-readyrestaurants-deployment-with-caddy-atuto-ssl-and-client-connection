import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController, SubscriptionPlansController } from './owner.controller';
import { OwnerAuthGuard } from './owner-auth.guard';
import { OwnerService } from './owner.service';
import { Owner, OwnerSchema } from './schema/owner.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Owner.name, schema: OwnerSchema }])],
  controllers: [OwnerController, SubscriptionPlansController],
  providers: [OwnerService, OwnerAuthGuard, JwtService],
  exports: [OwnerService],
})
export class OwnerModule {}
