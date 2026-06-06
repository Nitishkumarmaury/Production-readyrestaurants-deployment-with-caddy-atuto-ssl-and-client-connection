import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { config } from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { Customers, CustomersModel } from 'src/customer/schema/customer.schema';
import { Sessions, SessionsModel } from 'src/auth/schema/session.schema';
import { Languages, LanguagesModel } from 'src/admin/schema/language.schema';
import { Drivers, DriversModel } from 'src/driver/schema/driver.schema';
import { CustomerAddress, CustomerAddressModel } from 'src/address/schema/customer-address.schema';
import { Vendor, VendorModel } from 'src/vendor/schema/vendor.schema';
import { FoodItems, FoodItemsModel } from 'src/food/schema/food-item.schema';
import { Restaurant, RestaurantModel } from 'src/restaurant/schema/restaurant.schema';
import { Category, CategoryModel } from 'src/category/schema/category.schema';
import { Coupons, CouponsModel } from 'src/coupon/schema/coupon.schema';
import { Orders, OrdersModel } from 'src/order/schema/order.schema';
import { Cards, CardsModel } from 'src/card/schema/cards.schema';
import { Payments, PaymentsModel } from 'src/payment/schema/payment.schema';
import { Reviews, ReviewsModel } from 'src/review/schema/review.schema';
import { Favourites, FavouritesModel } from 'src/favourite/schema/favourite.schema';
import { FoodService } from 'src/food/food.service';
import { CustomizationGroups, CustomizationGroupsModel } from 'src/food/schema/customization-group';
import { Vehicles, VehiclesModel } from 'src/vehicle/schema/vehicle.schema';
import { OrderDriverRequests, OrderDriverRequestsModel } from 'src/order/schema/order-driver-request.schema';
import { Declined_bookings, Declined_bookingsModel } from 'src/order/schema/declined-bookings.schema';
import { Earnings, EarningsModel } from 'src/earning/schema/earning.schema';
import { Pricings, PricingsModel } from 'src/pricing/schema/pricing.schema';
import { Banks, BanksModel } from 'src/bank/schema/bank.schema';
import { Chats, ChatsModel } from 'src/chat/schema/chat.schema';
import { Connections, ConnectionsModel } from 'src/chat/schema/connection.schema';
import { Faqs, FaqsModel } from 'src/faq/schema/faq.schema';
import { Pages, PagesModel } from 'src/content-page/schema/page.schema';
import { Admin, AdminModel } from 'src/admin/schema/admin.schema';
import { Tax, TaxModel } from 'src/admin/schema/tax.schema';
import { AppConfiguration, AppConfigurationModel } from 'src/configuration/schema/app-configuration.schema';
import { Contactus, ContactusModel } from 'src/contactus/schema/contactus.schema';
import { Reports, ReportsModel } from 'src/report/schema/report.schema';
import { DbController } from './db.controller';
import { QuickPicks, QuickPicksModel } from 'src/quick_picks/schema/quick_picks.schema';
import { Referral, ReferralModel } from 'src/referrals/entities/referral.entity';
import { ReferralUsage, ReferralUsageModel } from 'src/referrals/entities/referral-usage.entity';
import { Wallet, WalletModel } from 'src/wallet/entities/wallet.entity';
import { WalletTransaction, WalletTransactionUsageModel } from 'src/wallet/entities/wallet-transaction.entity';
import { LoyaltySettings, loyaltySettingsModel } from 'src/loyality-points/entities/loyality-point.entity';
import { LoyaltyHistory, loyaltyHistoryModel } from 'src/loyality-points/entities/loyality-history.entity';
import { LoyaltyWallet, LoyaltyWalletModel } from 'src/loyality-points/entities/loyality-wallet.entity';
import { RestaurantBanner, RestaurantBannerModel } from 'src/resturant-banner/entities/resturant-banner.entity';
import { SosContact, SosContactModel } from 'src/sos-system/entities/sos-system.entity';
import { Notification, NotificationModel } from 'src/notification/entities/notification.entity';
import { CustomerReferralOrder, CustomerReferralOrderModel } from 'src/customer/schema/customer-referral.schema';
import { ChatBotChatHistory, ChatBotChatHistoryModel } from 'src/chat-bot/entities/chat-bot.entity';
import { ChatBotSession, ChatBotSessionModel } from 'src/chat-bot/entities/chat-bot-session.entity';
import { Embedding, EmbeddingModel } from 'src/embedding/entities/embedding.entity';
import { DriverProducts, DriverProductsModel } from 'src/driver-products/schema/driver-product-schema';
import { DriverOrders, DriverOrdersModel } from 'src/driver-products/schema/driver-order-schema';
import { DriverItems, DriverItemsModel } from 'src/driver-products/schema/driver-item-schema';
import { Payout, PayoutModel } from 'src/earning/schema/payout.schema';
import { DocumentRequirement, DocumentRequirementModel } from 'src/document/entities/document.entity';
import { UplodedDocument, UplodedDocumentModel } from 'src/document/entities/uploaded-documents.schema';
import { ReportReason, ReportReasonModel } from 'src/report-reason/schema/report-reason.schema';
import { Amenities, AmenitiesModel } from 'src/restaurant/schema/amenities.schema';
import { Services, ServicesModel } from 'src/restaurant/schema/services.schema';
// import { HomeCookedServices, HomeCookedServicesModel } from 'src/restaurant/schema/home-cooked-services.schema';
import { Slot, SlotModel } from 'src/slot/schema/slot.schema';
import { CustomerSlot, CustomerSlotModel } from 'src/slot/schema/customer-slot.schema';
import { SubscribeOrder, SubscribeOrderModel } from 'src/order/schema/order-subscribe.schema';
import { ServiceLocation, ServiceLocationModel } from 'src/service-location/schema/service-location-schema.';
import { CloudNotification, CloudNotificationModel } from 'src/notification/entities/cloud-notification.schema';
import { ErrorLogs, ErrorLogsModel } from 'src/exception/schema/exception.schema';
import { CateringPlan, CateringPlanModel } from 'src/catering_services/schema/catering_plan.schema';
import { Plate, PlateModel } from 'src/catering_services/schema/plate.schema';
import { Deals, DealsModel } from 'src/deal/schema/deal.schema';
import { DealBuy, DealBuyModel } from 'src/deal/schema/deal-buy.schema';
import { PartyBlast, PartyBlastModel } from 'src/party-blast/schema/party-blast.schema';
import { SubscriptionItems, SubscriptionItemsModel } from 'src/subscriptions/schema/subscription.schema';
import { CustomerCreateSubscription, CustomerCreateSubscriptionModel } from 'src/subscriptions/schema/customerSubscription.schema';
import { GroceryItems, GroceryItemsModel } from 'src/grocery/schema/grocery.schema';
import { OrderSubscripition, OrderSubscripitionModel } from 'src/subscriptions/schema/orderSubscripition.schema';
import { Cart, CartSchema } from 'src/grocery/schema/cart.schema';
import { GroceryOrder, GroceryOrderSchema } from 'src/grocery/schema/groceryOrder.schema';
import { Stock, stockModel } from 'src/grocery/schema/stock.schema';
import { Expenses, ExpensesModel } from 'src/earning/schema/expense.schema';
import { RestaurantDrivers, RestaurantDriversModel } from 'src/restaurant/schema/restaurant-drivers.schema';


config()
@Global()
@Module({
  imports: [

    
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DB_URL,
      }),
    }),
    

    MongooseModule.forFeature([
      { name: Customers.name, schema: CustomersModel },
      { name: Sessions.name, schema: SessionsModel },
      { name: Languages.name, schema: LanguagesModel },
      { name: Drivers.name, schema: DriversModel },
      { name: CustomerAddress.name, schema: CustomerAddressModel },
      { name: Vendor.name, schema: VendorModel },
      { name: FoodItems.name, schema: FoodItemsModel },
      { name: Restaurant.name, schema: RestaurantModel },
      { name: Category.name, schema: CategoryModel },
      { name: Coupons.name, schema: CouponsModel },
      { name: Orders.name, schema: OrdersModel },
      { name: Cards.name, schema: CardsModel },
      { name: Payments.name, schema: PaymentsModel },
      { name: Reviews.name, schema: ReviewsModel },
      { name: Favourites.name, schema: FavouritesModel },
      { name: CustomizationGroups.name, schema: CustomizationGroupsModel },
      { name: Vehicles.name, schema: VehiclesModel },
      { name: OrderDriverRequests.name, schema: OrderDriverRequestsModel },
      { name: Declined_bookings.name, schema: Declined_bookingsModel },
      { name: Earnings.name, schema: EarningsModel },
      { name: Pricings.name, schema: PricingsModel },
      { name: Banks.name, schema: BanksModel },
      { name: Chats.name, schema: ChatsModel },
      { name: Connections.name, schema: ConnectionsModel },
      { name: Faqs.name, schema: FaqsModel },
      { name: Pages.name, schema: PagesModel },
      { name: Admin.name, schema: AdminModel },
      { name: Tax.name, schema: TaxModel },
      { name: AppConfiguration.name, schema: AppConfigurationModel },
      { name: Contactus.name, schema: ContactusModel },
      { name: Reports.name, schema: ReportsModel },
      { name: QuickPicks.name, schema: QuickPicksModel },
      { name: Referral.name, schema: ReferralModel },
      { name: ReferralUsage.name, schema: ReferralUsageModel },
      { name: Wallet.name, schema: WalletModel },
      { name: WalletTransaction.name, schema: WalletTransactionUsageModel },
      { name: LoyaltySettings.name, schema: loyaltySettingsModel },
      { name: LoyaltyHistory.name, schema: loyaltyHistoryModel },
      { name: LoyaltyWallet.name, schema: LoyaltyWalletModel },
      { name: RestaurantBanner.name, schema: RestaurantBannerModel },
      { name: SosContact.name, schema: SosContactModel },
      { name: Notification.name, schema: NotificationModel },
      { name: CustomerReferralOrder.name, schema: CustomerReferralOrderModel },
      { name: ChatBotChatHistory.name, schema: ChatBotChatHistoryModel },
      { name: ChatBotSession.name, schema: ChatBotSessionModel },
      { name: Embedding.name, schema: EmbeddingModel },
      { name: DriverProducts.name, schema: DriverProductsModel },
      { name: DriverOrders.name, schema: DriverOrdersModel },
      { name: DriverItems.name, schema: DriverItemsModel },
      { name: Payout.name, schema: PayoutModel },
      { name: DocumentRequirement.name, schema: DocumentRequirementModel },
      { name: UplodedDocument.name, schema: UplodedDocumentModel },
      { name: ReportReason.name, schema: ReportReasonModel },
      { name: Amenities.name, schema: AmenitiesModel },
      { name: Services.name, schema: ServicesModel },
      // { name: HomeCookedServices.name, schema: HomeCookedServicesModel },
      { name: Slot.name, schema: SlotModel },
      { name: CustomerSlot.name, schema: CustomerSlotModel },
      { name: SubscribeOrder.name, schema: SubscribeOrderModel },
      { name: ServiceLocation.name, schema: ServiceLocationModel },
      { name: CloudNotification.name, schema: CloudNotificationModel },
      { name: ErrorLogs.name, schema: ErrorLogsModel },

      { name: CateringPlan.name, schema: CateringPlanModel },

      { name: Plate.name, schema: PlateModel },
      { name: Deals.name, schema: DealsModel },
      { name: DealBuy.name, schema: DealBuyModel },
      { name: PartyBlast.name, schema: PartyBlastModel },
      { name: SubscriptionItems.name, schema: SubscriptionItemsModel },

      { name: CustomerCreateSubscription.name, schema: CustomerCreateSubscriptionModel },
      { name: GroceryItems.name, schema: GroceryItemsModel },
      { name: OrderSubscripition.name, schema: OrderSubscripitionModel },
      { name: Cart.name, schema: CartSchema },
      { name: GroceryOrder.name, schema: GroceryOrderSchema },
      { name: Stock.name, schema: stockModel },
      { name: Expenses.name, schema: ExpensesModel },

      { name: RestaurantDrivers.name, schema: RestaurantDriversModel },

    ])

  ],
  controllers: [DbController],
  providers: [DbService],
  exports: [DbService]
})
export class DbModule { }
