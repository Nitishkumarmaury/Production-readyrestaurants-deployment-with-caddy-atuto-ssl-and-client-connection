import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import mongoose from 'mongoose';
import * as moment from 'moment';
import { types } from 'util';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { RazorpayService } from 'src/razorpay/razorpay.service';

@Injectable()
export class WalletService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly RazorpayService: RazorpayService,
  ) { }

  async getWalletBalance(userId: string) {
    const wallet = await this.model.walletModel.findOne({ customer_id: new mongoose.Types.ObjectId(userId) });
    return {
      balance: wallet?.balance || 0,
      refund_balance: wallet?.refund_balance || 0,
    };
  }

  async getWalletTransactions(userId: string, page = 1, limit = 10, debit_type?: string) {
    const skip = (page - 1) * limit;
    const debitType = debit_type;

    const query: any = { customer_id: new mongoose.Types.ObjectId(userId) };
    if (debitType) {
      query.debit_type = debitType;
    }

    const [transactions, total] = await Promise.all([
      this.model.walletTransactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'order_id',
          populate: {
            path: 'restaurant_id'
          },
        })
        .lean(),

      this.model.walletTransactionModel.countDocuments(query),
    ]);

    return {
      total,
      page,
      limit,
      transactions,
    };
  }

  async verifyAndCreditStripePayment(userId: string, payment_intent_id: string, amount: number) {
    try {
      // 1. Retrieve and verify payment from Stripe

      let stripeClient =await this.commonService.createStripeClient();
      const paymentIntent = await stripeClient.paymentIntents.retrieve(payment_intent_id);

      if (
        paymentIntent.status !== 'succeeded' ||
        paymentIntent.amount !== amount ||
        (paymentIntent.metadata?.customer_id && paymentIntent.metadata.customer_id !== String(userId))
      ) {
        throw new BadRequestException('Invalid payment details or unauthorized access.');
      }

      // 2. Check for duplicate transaction
      const alreadyExists = await this.model.walletTransactionModel.findOne({
        stripe_payment_intent: payment_intent_id,
      });
      if (alreadyExists) {
        throw new ConflictException('This transaction has already been processed.');
      }

      // 3. Credit wallet balance
      const wallet = await this.model.walletModel.findOneAndUpdate(
        { customer_id: userId },
        { $inc: { balance: amount } },
        { upsert: true, new: true }
      );

      // 4. Save transaction log
      await this.model.walletTransactionModel.create({
        customer_id: userId,
        amount,
        transaction_type: 'CREDIT',
        description: 'Stripe wallet deposit',
        stripe_payment_intent: payment_intent_id,
      });

      return { balance: wallet.balance };
    } catch (error) {
      console.error('Stripe wallet credit error:', error);
      throw new InternalServerErrorException('Failed to verify or credit wallet.');
    }
  }

  async createAddMoneyIntent(customer: any, amount: number) {
    try {
      amount = Number(amount); // to fix language change 
      
     
      const stripeCustomerId = customer?.stripe_customer_id || customer._id?.toString();
      console.log("amount", amount);
      if (!amount || amount <= 0) {
        throw new HttpException(
          {
            error_code: 'INVALID_AMOUNT',
            error_description: 'Amount must be greater than 0.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }


      const appConfig = await this.model.appConfiguration.findOne();
      if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {

        let walletData = {
          amount : amount
        }

       console.log("wallet data", walletData);

        // create payment intent for razor pay 
        let createOrder = null;


        let obj = {
          paymentFor : "wallet",
          walletData : walletData,
          total_amount : walletData.amount,
          customer : customer
        }


        console.log("obj for razorpay", obj);

      


        // let razorpay = await this.RazorpayService.createPaymentIntent(null, customer, null, "wallet", null, walletData);
        let razorpay = await this.RazorpayService.createPaymentIntent(obj);
        console.log("razorpay order for wallet", razorpay);
        return {
          razorpay: razorpay,
          amount : amount
        };


      }

      let stripeClient =await this.commonService.createStripeClient();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // amount in cents
        currency: 'aud',
        payment_method_options: {
          card: {
            setup_future_usage: 'none'
          }
        },
        customer: stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: 'card',
          customer_id: customer._id.toString(),
          meta_type: 'WALLET_DEPOSIT',
          initiated_at: moment.utc().valueOf(),
        },
      });
      console.log("payment intent for wallet stripe", paymentIntent);


      let ephemeralKey = await this.commonService.createEphemeralKey(customer?.stripe_customer_id);
      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        ephemeralKey : ephemeralKey,
        customer: customer.stripe_customer_id,
      };
    } catch (error) {
      throw error;
    }
  }

}
