import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CommonService } from 'src/common/common.service';
import { JwtService } from '@nestjs/jwt';
import { DbService } from 'src/db/db.service';
import { DriverService } from 'src/driver/driver.service';
import { CustomerService } from 'src/customer/customer.service';
import { CustomerAggregation } from 'src/customer/customer.aggregation';
import { DriverAggregation } from 'src/driver/driver.aggregation';
import { DiverSocket } from "src/driver/driver.socket";
import { Referral, ReferralSchema } from 'src/referrals/entities/referral.entity';
import { ReferralUsage, ReferralUsageSchema } from 'src/referrals/entities/referral-usage.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletTransaction, WalletTransactionSchema } from 'src/wallet/entities/wallet-transaction.entity';
import { Wallet, WalletSchema } from 'src/wallet/entities/wallet.entity';
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';
import { VendorModule } from 'src/vendor/vendor.module';
@Global()
@Module({
  imports: [
    LoyalityPointsModule,
    forwardRef(() => VendorModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, DriverService, CustomerService, CustomerAggregation, DriverAggregation, DiverSocket],
  exports: [AuthService, JwtService]
})
export class AuthModule { }
