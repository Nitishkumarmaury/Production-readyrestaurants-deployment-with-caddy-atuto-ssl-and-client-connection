import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { WalletTransaction, WalletTransactionSchema } from './entities/wallet-transaction.entity';
import { RazorpayModule } from 'src/razorpay/razorpay.module';

@Module({
  imports : [RazorpayModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule { }
