import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { DbModule } from './db/db.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { DriverModule } from './driver/driver.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { VendorModule } from './vendor/vendor.module';
import { CategoryModule } from './category/category.module';
import { FoodModule } from './food/food.module';
import { AddressModule } from './address/address.module';
import { CouponModule } from './coupon/coupon.module';
import { OrderModule } from './order/order.module';
import { CardModule } from './card/card.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { FavouriteModule } from './favourite/favourite.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { SocketModule } from './socket/socket.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobService } from './cronjob/cronjob.service';
import { EarningModule } from './earning/earning.module';
import { PricingModule } from './pricing/pricing.module';
import { BankModule } from './bank/bank.module';
import { ChatModule } from './chat/chat.module';
import { ContentPageModule } from './content-page/content-page.module';
import { FaqModule } from './faq/faq.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { ContactusModule } from './contactus/contactus.module';
import { ReportModule } from './report/report.module';
import { QuickPicksModule } from './quick_picks/quick_picks.module';
import { ReferralsModule } from './referrals/referrals.module';
import { WalletModule } from './wallet/wallet.module';
import { LoyalityPointsModule } from './loyality-points/loyality-points.module';
import { ResturantBannerModule } from './resturant-banner/resturant-banner.module';
import { SosSystemModule } from './sos-system/sos-system.module';
import { NotificationModule } from './notification/notification.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { ChatBotModule } from './chat-bot/chat-bot.module';
import { DriverProductsModule } from './driver-products/driver-products.module';
import { DocumentModule } from './document/document.module';
import { ReportReasonModule } from './report-reason/report-reason.module';
import { SlotModule } from './slot/slot.module';
import { ServiceLocationModule } from './service-location/service-location.module';
import { LanguageModule } from './language/language.module';
import { ExceptionModule } from './exception/exception.module';
import { CateringServicesModule } from './catering_services/catering_services.module';
import { DealModule } from './deal/deal.module';
import { PartyBlastModule } from './party-blast/party-blast.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GroceryModule } from './grocery/grocery.module';
import { TenantLoggerMiddleware } from './middlewares/tenant-logger.middleware';
import { BullModule } from '@nestjs/bull';
import { JobsModule } from './jobs/jobs.module';
import { WorkModule } from './work/work.module';
import { OwnerModule } from './owner/owner.module';
@Module({
  imports: [

    // BullModule.forRoot({
    //   redis: {
    //     host: '127.0.0.1',
    //     port: 6379,
    //   },
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    // ScheduleModule.forRoot(),
    AuthModule,
    CustomerModule,
    DbModule,
    OwnerModule,
    AdminModule,
    CommonModule,
    DriverModule,
    RestaurantModule,
    CategoryModule,
    FoodModule,
    AddressModule,
    CouponModule,
    OrderModule,
    VendorModule,
    CardModule,
    PaymentModule,
    ReviewModule,
    FavouriteModule,
    VehicleModule,
    SocketModule,
    EarningModule,
    PricingModule,
    BankModule,
    ChatModule,
    ContentPageModule,
    FaqModule,
    ConfigurationModule,
    ContactusModule,
    ReportModule,
    QuickPicksModule,
    NotificationModule,
    ResturantBannerModule,
    LoyalityPointsModule,
    WalletModule,
    ReferralsModule,
    RazorpayModule,
    EmbeddingModule,
    ChatBotModule,
    DriverProductsModule,
    DocumentModule,
    ReportReasonModule,
    SosSystemModule,
    SlotModule,
    ServiceLocationModule,
    LanguageModule,
    ExceptionModule,
    CateringServicesModule,
    DealModule,
    PartyBlastModule,
    SubscriptionsModule,
    GroceryModule,
    
    // WorkModule,
    // JobsModule
  ],
  controllers: [AppController],
  // providers: [AppService, CronjobService],
  providers: [AppService,],
})
export class AppModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }); 
  }


}
