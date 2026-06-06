import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AddressModule } from 'src/address/address.module';
import { AdminModule } from 'src/admin/admin.module';
import { AuthModule } from 'src/auth/auth.module';
import { BankModule } from 'src/bank/bank.module';
import { CardModule } from 'src/card/card.module';
import { CategoryModule } from 'src/category/category.module';
import { ChatBotModule } from 'src/chat-bot/chat-bot.module';
import { ChatModule } from 'src/chat/chat.module';
import { CommonModule } from 'src/common/common.module';
import { CommonService } from 'src/common/common.service';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { ContactusModule } from 'src/contactus/contactus.module';
import { ContentPageModule } from 'src/content-page/content-page.module';
import { CouponModule } from 'src/coupon/coupon.module';
import { CronjobService } from 'src/cronjob/cronjob.service';
import { CustomerAggregation } from 'src/customer/customer.aggregation';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerService } from 'src/customer/customer.service';
import { DbModule } from 'src/db/db.module';
import { DocumentModule } from 'src/document/document.module';
import { DriverProductsModule } from 'src/driver-products/driver-products.module';
import { DriverModule } from 'src/driver/driver.module';
import { EarningModule } from 'src/earning/earning.module';
import { EmbeddingModule } from 'src/embedding/embedding.module';
import { FaqModule } from 'src/faq/faq.module';
import { FavouriteModule } from 'src/favourite/favourite.module';
import { FoodModule } from 'src/food/food.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { LoyalityPointsModule } from 'src/loyality-points/loyality-points.module';
import { LoyalityPointsService } from 'src/loyality-points/loyality-points.service';
import { NotificationModule } from 'src/notification/notification.module';
import { OrderModule } from 'src/order/order.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PaymentService } from 'src/payment/payment.service';
import { PricingModule } from 'src/pricing/pricing.module';
import { QuickPicksModule } from 'src/quick_picks/quick_picks.module';
import { RazorpayModule } from 'src/razorpay/razorpay.module';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { ReferralsModule } from 'src/referrals/referrals.module';
import { ReportReasonModule } from 'src/report-reason/report-reason.module';
import { ReportModule } from 'src/report/report.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { ResturantBannerModule } from 'src/resturant-banner/resturant-banner.module';
import { ReviewModule } from 'src/review/review.module';
import { ServiceLocationModule } from 'src/service-location/service-location.module';
import { SlotModule } from 'src/slot/slot.module';
import { SocketModule } from 'src/socket/socket.module';
import { SosSystemModule } from 'src/sos-system/sos-system.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { VendorModule } from 'src/vendor/vendor.module';
import { WalletModule } from 'src/wallet/wallet.module';

import { JwtModule } from '@nestjs/jwt';
import { OrderService } from 'src/order/order.service';
import { OrderAggregation } from 'src/order/order.aggregation';
import { AppService } from 'src/app.service';
import { ScheduleModule } from '@nestjs/schedule';





@Module({

    imports: [

        BullModule.forRoot({
          redis: {
            host: '127.0.0.1',
            port: 6379,
          },
        }),

            ScheduleModule.forRoot(),
        

        ConfigModule.forRoot({
            isGlobal: true,
        }), 
    
        AuthModule,
        DbModule,
        CommonModule,
        OrderModule,
        VendorModule,
        RestaurantModule,

        JobsModule
 
    ],
    providers: [ 
        ConfigurationService,
        CronjobService, 
        RazorpayService,
        CommonService,
        PaymentService,
        LoyalityPointsService,
        CustomerService,
        CustomerAggregation,
        CommonService,
        JwtService,
        OrderService,
        OrderAggregation,
        AppService,
    ],



})
export class WorkModule {
}
