import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { VendorService } from 'src/vendor/vendor.service';
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
import { CustomerService } from 'src/customer/customer.service';
import { VendorAggregation } from 'src/vendor/vendor.aggregation';
import { SocketGateway } from 'src/socket/socket.gateway';
import { SocketService } from 'src/socket/socket.service';
import { ChatService } from 'src/chat/chat.service';
import { CustomerAggregation } from 'src/customer/customer.aggregation';
import { EarningService } from 'src/earning/earning.service';
import { EarningsAggregation } from 'src/earning/earning.aggregation';
import { AppService } from 'src/app.service';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { PaymentService } from 'src/payment/payment.service';
import { OrderService } from 'src/order/order.service';
import { OrderAggregation } from 'src/order/order.aggregation';
import { SlotService } from 'src/slot/slot.service';
import { AdminService } from 'src/admin/admin.service';
import { AdminAggregation } from 'src/admin/admin.aggregation';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionAggregation } from 'src/subscriptions/subscription.aggregation';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cron-queue',
    }),
  ],
  providers: [JobsService, JobsProcessor, 
    LoyalityPointsService,
    VendorAggregation,
    SocketGateway,
    SocketService,
    VendorService,
    CustomerService,
    ChatService,
    CustomerAggregation,
    EarningService,
    EarningsAggregation,
    AppService,
    RazorpayService,
    PaymentService,
    OrderService,
    OrderAggregation,

    SlotService,

    AdminService,
    AdminAggregation,

    SubscriptionsService,
    SubscriptionAggregation,
  
  ],
  exports: [JobsService],
})
export class JobsModule {}