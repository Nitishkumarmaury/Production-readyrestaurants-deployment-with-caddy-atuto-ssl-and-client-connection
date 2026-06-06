import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customers, CustomersModel } from 'src/customer/schema/customer.schema';
import { Model } from 'mongoose';
import { Sessions, SessionsModel } from 'src/auth/schema/session.schema';
import * as bcrypt from 'bcrypt';
import { Languages, LanguagesModel } from 'src/admin/schema/language.schema';
import { Drivers, DriversModel } from 'src/driver/schema/driver.schema';
import {
  CustomerAddress,
  CustomerAddressModel,
} from 'src/address/schema/customer-address.schema';
import { Vendor, VendorModel } from 'src/vendor/schema/vendor.schema';
import { FoodItems, FoodItemsModel } from 'src/food/schema/food-item.schema';
import {
  Restaurant,
  RestaurantModel,
} from 'src/restaurant/schema/restaurant.schema';
import { Category, CategoryModel } from 'src/category/schema/category.schema';
import { Coupons, CouponsModel } from 'src/coupon/schema/coupon.schema';
import { Orders, OrdersModel } from 'src/order/schema/order.schema';
import { Cards, CardsModel } from 'src/card/schema/cards.schema';
import { Payments, PaymentsModel } from 'src/payment/schema/payment.schema';
import { Reviews, ReviewsModel } from 'src/review/schema/review.schema';
import {
  Favourites,
  FavouritesModel,
} from 'src/favourite/schema/favourite.schema';
import {
  CustomizationGroups,
  CustomizationGroupsModel,
} from 'src/food/schema/customization-group';
import { Vehicles, VehiclesModel } from 'src/vehicle/schema/vehicle.schema';
import {
  OrderDriverRequests,
  OrderDriverRequestsModel,
} from 'src/order/schema/order-driver-request.schema';
import {
  Declined_bookings,
  Declined_bookingsModel,
} from 'src/order/schema/declined-bookings.schema';
import { Earnings, EarningsModel } from 'src/earning/schema/earning.schema';
import { Pricings, PricingsModel } from 'src/pricing/schema/pricing.schema';
import { Banks, BanksModel } from 'src/bank/schema/bank.schema';
import { Chats, ChatsModel } from 'src/chat/schema/chat.schema';
import {
  Connections,
  ConnectionsModel,
} from 'src/chat/schema/connection.schema';
import { Faqs, FaqsModel } from 'src/faq/schema/faq.schema';
import { Pages, PagesModel } from 'src/content-page/schema/page.schema';
import { Admin, AdminModel } from 'src/admin/schema/admin.schema';
import { Tax, TaxModel } from 'src/admin/schema/tax.schema';
import {
  AppConfiguration,
  AppConfigurationModel,
} from 'src/configuration/schema/app-configuration.schema';
import {
  Contactus,
  ContactusModel,
} from 'src/contactus/schema/contactus.schema';
import { Reports, ReportsModel } from 'src/report/schema/report.schema';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as moment from 'moment';
import { config } from 'dotenv';
import * as path from 'path';
import * as mime from 'mime-types';
import { exec } from 'child_process';
import * as fs from 'fs';
import {
  QuickPicks,
  QuickPicksModel,
} from 'src/quick_picks/schema/quick_picks.schema';
import {
  Referral,
  ReferralModel,
} from 'src/referrals/entities/referral.entity';
import {
  ReferralUsage,
  ReferralUsageModel,
} from 'src/referrals/entities/referral-usage.entity';
import { Wallet, WalletModel } from 'src/wallet/entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionUsageModel,
} from 'src/wallet/entities/wallet-transaction.entity';
import {
  LoyaltySettings,
  loyaltySettingsModel,
} from 'src/loyality-points/entities/loyality-point.entity';
import {
  LoyaltyHistory,
  loyaltyHistoryModel,
} from 'src/loyality-points/entities/loyality-history.entity';
import {
  LoyaltyWallet,
  LoyaltyWalletModel,
} from 'src/loyality-points/entities/loyality-wallet.entity';
import {
  RestaurantBanner,
  RestaurantBannerModel,
} from 'src/resturant-banner/entities/resturant-banner.entity';
import {
  SosContact,
  SosContactModel,
} from 'src/sos-system/entities/sos-system.entity';
import {
  Notification,
  NotificationModel,
} from 'src/notification/entities/notification.entity';
import {
  CustomerReferralOrder,
  CustomerReferralOrderModel,
} from 'src/customer/schema/customer-referral.schema';
import {
  ChatBotChatHistory,
  ChatBotChatHistoryModel,
} from 'src/chat-bot/entities/chat-bot.entity';
import {
  ChatBotSession,
  ChatBotSessionModel,
} from 'src/chat-bot/entities/chat-bot-session.entity';
import {
  Embedding,
  EmbeddingModel,
} from 'src/embedding/entities/embedding.entity';
import {
  DriverProducts,
  DriverProductsModel,
} from 'src/driver-products/schema/driver-product-schema';
import {
  DriverOrders,
  DriverOrdersModel,
} from 'src/driver-products/schema/driver-order-schema';
import {
  DriverItems,
  DriverItemsModel,
} from 'src/driver-products/schema/driver-item-schema';
import { Payout, PayoutModel } from 'src/earning/schema/payout.schema';
import {
  DocumentRequirement,
  DocumentRequirementModel,
} from 'src/document/entities/document.entity';
import {
  UplodedDocument,
  UplodedDocumentModel,
} from 'src/document/entities/uploaded-documents.schema';
import {
  ReportReason,
  ReportReasonModel,
} from 'src/report-reason/schema/report-reason.schema';
import {
  Amenities,
  AmenitiesModel,
} from 'src/restaurant/schema/amenities.schema';
import { Services, ServicesModel } from 'src/restaurant/schema/services.schema';
// import { HomeCookedServices } from 'src/restaurant/schema/home-cooked-services.schema';
import { Slot, SlotModel } from 'src/slot/schema/slot.schema';
import {
  CustomerSlot,
  CustomerSlotModel,
} from 'src/slot/schema/customer-slot.schema';
import {
  SubscribeOrder,
  SubscribeOrderModel,
} from 'src/order/schema/order-subscribe.schema';
import {
  ServiceLocation,
  ServiceLocationModel,
} from 'src/service-location/schema/service-location-schema.';
import {
  CloudNotification,
  CloudNotificationModel,
} from 'src/notification/entities/cloud-notification.schema';
import {
  ErrorLogs,
  ErrorLogsModel,
} from 'src/exception/schema/exception.schema';
import {
  CateringPlan,
  CateringPlanModel,
} from 'src/catering_services/schema/catering_plan.schema';
import { Plate, PlateModel } from 'src/catering_services/schema/plate.schema';
import { Deals, DealsModel } from 'src/deal/schema/deal.schema';
import { DealBuy, DealBuyModel } from 'src/deal/schema/deal-buy.schema';
import {
  PartyBlast,
  PartyBlastModel,
} from 'src/party-blast/schema/party-blast.schema';
import {
  SubscriptionItems,
  SubscriptionItemsModel,
} from 'src/subscriptions/schema/subscription.schema';
import {
  CustomerCreateSubscription,
  CustomerCreateSubscriptionModel,
} from 'src/subscriptions/schema/customerSubscription.schema';
import {
  GroceryItems,
  GroceryItemsModel,
} from 'src/grocery/schema/grocery.schema';
import {
  OrderSubscripition,
  OrderSubscripitionModel,
} from 'src/subscriptions/schema/orderSubscripition.schema';
import { Cart, CartSchema } from 'src/grocery/schema/cart.schema';
import {
  GroceryOrder,
  GroceryOrderSchema,
} from 'src/grocery/schema/groceryOrder.schema';
import { Stock, stockModel } from 'src/grocery/schema/stock.schema';
import { Expenses, ExpensesModel } from 'src/earning/schema/expense.schema';
import mongoose from 'mongoose';
import {
  ConfigurationData,
  ConfigurationData_For_Dev,
  contentPageData,
  languageData,
} from 'src/admin/schema/db-data';
import {
  RestaurantDrivers,
  RestaurantDriversModel,
} from 'src/restaurant/schema/restaurant-drivers.schema';

config();
const { DB_URL } = process.env;
const databaseConfig: string = DB_URL;

@Injectable()
export class DbService {
  private s3: AWS.S3;
  private bucketName: string;
  private base_url: string;

  private tenantConnections: Map<string, any>;

  public customer: Model<Customers>;
  public session: Model<Sessions>;
  public language: Model<Languages>;
  public driver: Model<Drivers>;
  public customerAddress: Model<CustomerAddress>;
  public vendor: Model<Vendor>;
  public food: Model<FoodItems>;
  public restaurant: Model<Restaurant>;
  public category: Model<Category>;
  public coupon: Model<Coupons>;
  public order: Model<Orders>;
  public card: Model<Cards>;
  public payment: Model<Payments>;
  public review: Model<Reviews>;
  public favourite: Model<Favourites>;

  public customizationGroup: Model<CustomizationGroups>;
  public vehicle: Model<Vehicles>;
  public orderDriverRequests: Model<OrderDriverRequests>;
  public declined_bookings: Model<Declined_bookings>;
  public earnings: Model<Earnings>;
  public pricing: Model<Pricings>;
  public bank: Model<Banks>;
  public chat: Model<Chats>;
  public connection: Model<Connections>;
  public faqs: Model<Faqs>;
  public pages: Model<Pages>;
  public admin: Model<Admin>;
  public tax: Model<Tax>;
  public contactUs: Model<Contactus>;
  public reports: Model<Reports>;
  public quickpicks: Model<QuickPicks>;
  public referralModel: Model<Referral>;
  public referralUsageModel: Model<ReferralUsage>;
  public walletModel: Model<Wallet>;

  public walletTransactionModel: Model<WalletTransaction>;
  public loyaltySettingsModel: Model<LoyaltySettings>;
  public loyaltyHistoryModel: Model<LoyaltyHistory>;
  public LoyaltyWalletModel: Model<LoyaltyWallet>;
  public RestaurantBannerModel: Model<RestaurantBanner>;
  public SosContactModel: Model<SosContact>;
  public NotificationModel: Model<Notification>;
  public CustomerReferralOrderModel: Model<CustomerReferralOrder>;
  public ChatBotChatHistoryModel: Model<ChatBotChatHistory>;
  public ChatBotSessionModel: Model<ChatBotSession>;
  public EmbeddingModel: Model<Embedding>;
  public DriverProductsModel: Model<DriverProducts>;

  public DriverOrderModel: Model<DriverOrders>;
  public DriverItemsModel: Model<DriverItems>;
  public PayoutModel: Model<Payout>;
  public DocumentRequirementModel: Model<DocumentRequirement>;
  public UplodedDocumentModel: Model<UplodedDocument>;
  public ReportReasonModel: Model<ReportReason>;
  public AmenitiesModel: Model<Amenities>;
  public ServicesModel: Model<Services>;

  public SlotModel: Model<Slot>;
  public CustomerSlotModel: Model<CustomerSlot>;
  public SubscribeOrderModel: Model<SubscribeOrder>;
  public ServiceLocationModel: Model<ServiceLocation>;
  public CloudNotificationModel: Model<CloudNotification>;
  public ErrorLogsModel: Model<ErrorLogs>;

  public CateringPlanModel: Model<CateringPlan>;
  public PlateModel: Model<Plate>;
  public DealsModel: Model<Deals>;
  public DealBuyModel: Model<DealBuy>;
  public PartyBlastModel: Model<PartyBlast>;
  public SubscriptionItems: Model<SubscriptionItems>;

  public customerCreateSubscription: Model<CustomerCreateSubscription>;
  public GroceryItems: Model<GroceryItems>;
  public orderSubscripition: Model<OrderSubscripition>; // orderSubscripition in subscription resource
  public cart: Model<Cart>;
  public groceryOrder: Model<GroceryOrder>;
  public stock: Model<Stock>;
  public Expenses: Model<Expenses>;

  public appConfiguration: Model<AppConfiguration>;

  public RestaurantDrivers: Model<RestaurantDrivers>;

  constructor(
    private readonly configService: ConfigService,
    // @InjectModel(AppConfiguration.name) public appConfiguration: Model<AppConfiguration>,
  ) {
    this.tenantConnections = new Map<string, any>();
  }

  async configBucketDetails() {
    const appConfig = await this.appConfiguration.findOne().lean();


    if (appConfig && appConfig.bucket) {
      this.base_url = `${appConfig?.bucket?.do_endpoint}/${appConfig?.bucket?.bucket_name}`; // ✅ access key

      const doSpacesEndpoint = appConfig.bucket.do_endpoint;
      const spaceEndpoint = new AWS.Endpoint(doSpacesEndpoint);
      this.s3 = new AWS.S3({
        accessKeyId: appConfig.bucket.do_access_key,
        secretAccessKey: appConfig.bucket.do_secret_access_key,
        endpoint: spaceEndpoint,
      });
      this.bucketName = appConfig.bucket.bucket_name;
    }

    return this.s3;
  }

  async create_backup(backup_name: string, gzip: boolean) {
    try {
      let URI = databaseConfig;

      let dump_path: any;
      if (process.env.ENVIORNMENT == 'LOCAL') {
        dump_path = path.resolve(__dirname, `./../db_backups/${backup_name}`);
      } else {
        dump_path = path.resolve(__dirname, `./../db_backups/${backup_name}`);
      }
      let command = `mongodump --uri="${URI}" ${gzip ? ' --gzip' : ''} --archive="${dump_path}"`;
      let gen_backup_file = await this.exexute_backup_command(command);
      return gen_backup_file;
    } catch (err) {
      throw err;
    }
  }

  async exexute_backup_command(command: string) {
    return new Promise((resolve, reject) => {
      try {
        exec(command, (err) => {
          if (err) {
            console.error('uploading error-..--..', err);
          } else {
            let message = 'BACKUP_CREATED';
            return resolve(message);
          }
        });
      } catch (err) {
        throw err;
      }
    });
  }

  // if backup count is less than 10
  async backup_case_1() {
    try {
      let fetch_data: any = await this.gen_backup_name();

      let { name } = fetch_data;
      let file_name = `${name}.gz`;

      let gen_backup = await this.create_backup(file_name, true);

      if (gen_backup == 'BACKUP_CREATED') {
        let fetch_file = path.resolve(
          __dirname,
          `./../db_backups/${file_name}`,
        );
        // check file type
        let mime_type = await mime.lookup(fetch_file);
        // read file
        let read_file = fs.readFileSync(fetch_file);

        let params = {
          Bucket: this.bucketName,
          Key: `backup/${file_name}`,
          Body: read_file,
          ContentType: mime_type,
        };
        let upload_file: any = await this.upload_file_to_spaces(params);

        let { Location, Key } = upload_file;

        fs.unlinkSync(fetch_file);

        const paramsToGetObject = {
          Bucket: this.bucketName,
          Key: Key,
          Expires: 3600, // URL expiration time in seconds (e.g., 1 hour)
        };
        const url = this.s3.getSignedUrl('getObject', paramsToGetObject);

        return url;
      } else {
        throw new HttpException('BACKUP_UPLOAD_FAILED', HttpStatus.BAD_REQUEST);
      }
    } catch (err) {
      throw err;
    }
  }

  async gen_backup_name() {
    try {
      let current_millis = moment().format('x');
      let current_date = moment().format('YYYY-MM-DD');
      let static_name = 'ReadyDeliveries';
      let name = `${static_name}_${current_date}_${current_millis}`;

      return {
        name: name,
        unique_key: current_millis,
      };
    } catch (err) {
      throw err;
    }
  }
  async upload_file_to_spaces(params: any) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.upload(params, (err: any, data) => {
          if (err) {
            console.error('uploading error', err);
          } else {
            return resolve(data);
          }
        });
      } catch (err) {
        throw reject(err);
      }
    });
  }

  async create_tenant_connection(db_url: string, db_name: string) {
    try {
      let runSeeder = false;

      if (db_url && db_name) {
        if (!this.tenantConnections.has(db_name?.trim())) {
          const uri = `${db_url}`;

          const connection = await mongoose
            .createConnection(uri, {
              maxPoolSize: 10, // Keep this very low for tenants
              minPoolSize: 1,
              serverSelectionTimeoutMS: 10000,
              socketTimeoutMS: 45000,
              waitQueueTimeoutMS: 5000, // Often helps with Atlas connection stability on certain networks
            })
            .asPromise();
          this.tenantConnections.set(db_name?.trim(), connection);

          runSeeder = true;
        }

        const connection = this.tenantConnections.get(db_name?.trim())!;

        this.customer = connection.model(Customers.name, CustomersModel);
        this.session = connection.model(Sessions.name, SessionsModel);
        this.driver = connection.model(Drivers.name, DriversModel);
        this.language = connection.model(Languages.name, LanguagesModel);
        this.customerAddress = connection.model(
          CustomerAddress.name,
          CustomerAddressModel,
        );
        this.vendor = connection.model(Vendor.name, VendorModel);
        this.food = connection.model(FoodItems.name, FoodItemsModel);
        this.restaurant = connection.model(Restaurant.name, RestaurantModel);
        this.category = connection.model(Category.name, CategoryModel);
        this.coupon = connection.model(Coupons.name, CouponsModel);
        this.order = connection.model(Orders.name, OrdersModel);
        this.card = connection.model(Cards.name, CardsModel);
        this.payment = connection.model(Payments.name, PaymentsModel);
        this.review = connection.model(Reviews.name, ReviewsModel);
        this.favourite = connection.model(Favourites.name, FavouritesModel);
        this.customizationGroup = connection.model(
          CustomizationGroups.name,
          CustomizationGroupsModel,
        );
        this.vehicle = connection.model(Vehicles.name, VehiclesModel);
        this.orderDriverRequests = connection.model(
          OrderDriverRequests.name,
          OrderDriverRequestsModel,
        );
        this.declined_bookings = connection.model(
          Declined_bookings.name,
          Declined_bookingsModel,
        );
        this.earnings = connection.model(Earnings.name, EarningsModel);
        this.pricing = connection.model(Pricings.name, PricingsModel);
        this.bank = connection.model(Banks.name, BanksModel);
        this.chat = connection.model(Chats.name, ChatsModel);
        this.connection = connection.model(Connections.name, ConnectionsModel);
        this.faqs = connection.model(Faqs.name, FaqsModel);
        this.pages = connection.model(Pages.name, PagesModel);
        this.admin = connection.model(Admin.name, AdminModel);

        this.tax = connection.model(Tax.name, TaxModel);
        this.contactUs = connection.model(Contactus.name, ContactusModel);
        this.reports = connection.model(Reports.name, ReportsModel);
        this.quickpicks = connection.model(QuickPicks.name, QuickPicksModel);
        this.referralModel = connection.model(Referral.name, ReferralModel);
        this.referralUsageModel = connection.model(
          ReferralUsage.name,
          ReferralUsageModel,
        );
        this.walletModel = connection.model(Wallet.name, WalletModel);

        this.walletTransactionModel = connection.model(
          WalletTransaction.name,
          WalletTransactionUsageModel,
        );
        this.loyaltySettingsModel = connection.model(
          LoyaltySettings.name,
          loyaltySettingsModel,
        );
        this.loyaltyHistoryModel = connection.model(
          LoyaltyHistory.name,
          loyaltyHistoryModel,
        );
        this.LoyaltyWalletModel = connection.model(
          LoyaltyWallet.name,
          LoyaltyWalletModel,
        );
        this.RestaurantBannerModel = connection.model(
          RestaurantBanner.name,
          RestaurantBannerModel,
        );
        this.SosContactModel = connection.model(
          SosContact.name,
          SosContactModel,
        );
        this.NotificationModel = connection.model(
          Notification.name,
          NotificationModel,
        );
        this.CustomerReferralOrderModel = connection.model(
          CustomerReferralOrder.name,
          CustomerReferralOrderModel,
        );
        this.ChatBotChatHistoryModel = connection.model(
          ChatBotChatHistory.name,
          ChatBotChatHistoryModel,
        );
        this.ChatBotSessionModel = connection.model(
          ChatBotSession.name,
          ChatBotSessionModel,
        );
        this.EmbeddingModel = connection.model(Embedding.name, EmbeddingModel);
        this.DriverProductsModel = connection.model(
          DriverProducts.name,
          DriverProductsModel,
        );

        this.DriverOrderModel = connection.model(
          DriverOrders.name,
          DriverOrdersModel,
        );
        this.DriverItemsModel = connection.model(
          DriverItems.name,
          DriverItemsModel,
        );
        this.PayoutModel = connection.model(Payout.name, PayoutModel);
        this.DocumentRequirementModel = connection.model(
          DocumentRequirement.name,
          DocumentRequirementModel,
        );
        this.UplodedDocumentModel = connection.model(
          UplodedDocument.name,
          UplodedDocumentModel,
        );
        this.ReportReasonModel = connection.model(
          ReportReason.name,
          ReportReasonModel,
        );
        this.AmenitiesModel = connection.model(Amenities.name, AmenitiesModel);
        this.ServicesModel = connection.model(Services.name, ServicesModel);

        this.SlotModel = connection.model(Slot.name, SlotModel);
        this.CustomerSlotModel = connection.model(
          CustomerSlot.name,
          CustomerSlotModel,
        );
        this.SubscribeOrderModel = connection.model(
          SubscribeOrder.name,
          SubscribeOrderModel,
        );
        this.ServiceLocationModel = connection.model(
          ServiceLocation.name,
          ServiceLocationModel,
        );
        this.CloudNotificationModel = connection.model(
          CloudNotification.name,
          CloudNotificationModel,
        );
        this.ErrorLogsModel = connection.model(ErrorLogs.name, ErrorLogsModel);

        this.CateringPlanModel = connection.model(
          CateringPlan.name,
          CateringPlanModel,
        );
        this.PlateModel = connection.model(Plate.name, PlateModel);
        this.DealsModel = connection.model(Deals.name, DealsModel);
        this.DealBuyModel = connection.model(DealBuy.name, DealBuyModel);
        this.PartyBlastModel = connection.model(
          PartyBlast.name,
          PartyBlastModel,
        );
        this.SubscriptionItems = connection.model(
          SubscriptionItems.name,
          SubscriptionItemsModel,
        );
        this.customerCreateSubscription = connection.model(
          CustomerCreateSubscription.name,
          CustomerCreateSubscriptionModel,
        );
        this.GroceryItems = connection.model(
          GroceryItems.name,
          GroceryItemsModel,
        );
        this.orderSubscripition = connection.model(
          OrderSubscripition.name,
          OrderSubscripitionModel,
        );
        this.cart = connection.model(Cart.name, CartSchema);
        this.groceryOrder = connection.model(
          GroceryOrder.name,
          GroceryOrderSchema,
        );
        this.stock = connection.model(Stock.name, stockModel);
        this.Expenses = connection.model(Expenses.name, ExpensesModel);

        this.appConfiguration = connection.model(
          AppConfiguration.name,
          AppConfigurationModel,
        );

        this.RestaurantDrivers = connection.model(
          RestaurantDrivers.name,
          RestaurantDriversModel,
        );

        await this.configBucketDetails();

        if (runSeeder) {
          await this.seeders();
        }
      }
    } catch (err) {
      throw err;
    }
  }

  async seeders() {
    try {
      console.log('Running seeders...');

      await Promise.all([
        this.BootStrapAmenities(),
        this.BootStrapServices(),
        this.BootStrapLanguage(),
        this.bootstrap_pages(),
        this.bootstrap_configuration(),
        this.syncVehicleType(),
        this.syncFoodCategory(),

        ...(process.env.ENVIROMENT !== 'live'
          ? [
              this.bootstrap_for_created_admin(),
              this.bootstrap_for_created_global_admin(),
            ]
          : []),
      ]);
    } catch (error) {
      throw error;
    }
  }

  async BootStrapAmenities() {
    const saveData = [
      'Parking',
      'Free Wifi',
      'RuPay Card Accepted',
      'Valet parking',
    ];

    const promises = saveData.map(async (name) => {
      return this.AmenitiesModel.findOneAndUpdate(
        {
          name: name,
        },
        {
          name: name,
        },
        {
          upsert: true,
          new: true,
        },
      );
    });

    await Promise.all(promises);
  }

  async BootStrapServices() {
    const saveData = [
      'Buffet',
      'Pubs & bars',
      'Rooftop and outdoors',
      'Quick bites',
      'Pet friendly',
    ];

    const promises = saveData.map(async (name) => {
      return this.ServicesModel.findOneAndUpdate(
        {
          name: name,
        },
        {
          name: name,
        },
        {
          upsert: true,
          new: true,
        },
      );
    });

    await Promise.all(promises);
  }

  async BootStrapLanguage() {
    let language = await this.language.countDocuments();
    if (language <= 0) {
      const saveData = languageData;

      await this.language.insertMany(saveData);
      console.log('languages sync successfully!');
    }
  }

  async bootstrap_for_created_admin() {
    const email = 'admin@gmail.com';

    let fetch_data: any = await this.admin.findOne({ email: email });

    if (!fetch_data) {
      let default_password = 'Admin@#123';
      let password = await bcrypt.hash(default_password, 10);
      let saveData = {
        name: 'super admin',
        image: null,
        email: 'admin@gmail.com',
        password: password,
        roles: [],
        superAdmin: true,
        subAdmin: false,
      };
      let data = await this.admin.create(saveData);
    }
  }

  async bootstrap_for_created_global_admin() {
    // to create global admin

    const email = 'globaladmin@gmail.com';

    let default_password = 'Global@#123';
    let password = await bcrypt.hash(default_password, 10);

    let fetch_data: any = await this.admin.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: 'global admin',
          image: null,
          email: 'global_admin@gmail.com',
          password: password,
          roles: [],
          superAdmin: false,
          subAdmin: false,
          globalAdmin: true,
        },
      },
      { new: true, upsert: true },
    );
  }

  async bootstrap_pages() {
    let fetch_data: any = await this.pages.find();
    if (fetch_data.length < 1) {
      console.log('pages created');
      const saveData = contentPageData;

      let data = await this.pages.create(saveData);
    }
  }

  async bootstrap_configuration() {
    let fetch_data: any = await this.appConfiguration.find();
    if (fetch_data.length < 1) {
      const saveData =
        process.env.ENVIROMENT == 'live'
          ? ConfigurationData
          : ConfigurationData_For_Dev;

      await this.appConfiguration.create(saveData);
    }
  }

  syncVehicleType = async () => {
    try {
      let vehicle = await this.vehicle.countDocuments();
      if (vehicle <= 0) {
        const payload = [
          { name: 'Electric Vehicle (EV)' },
          { name: 'Motorcycle / Scooty' },
        ];
        await this.vehicle.insertMany(payload);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  syncFoodCategory = async () => {
    try {
      let category = await this.category.countDocuments();
      if (category <= 0) {
        const payload: any = [
          {
            category_name: 'Burger',
            category_image:
              'a-flying-burger-with-all-the-layers-ai-generative-free-photo.jpg',
          },
          {
            category_name: 'Pasta',
            category_image: 'istockphoto-1325172440-612x612.jpg',
          },
          { category_name: 'Chicken', category_image: 'images (4).jpeg' },
          {
            category_name: 'Beverages',
            category_image: 'istockphoto-1366811978-612x612.jpg',
          },
          { category_name: 'Breakfast', category_image: 'download.jpg' },
          { category_name: 'Chinese', category_image: 'download (1).jpg' },
          {
            category_name: 'Desserts ',
            category_image:
              '360_F_301978652_O0aPwap1JaEVaAhj3mIlbqNnJGmRyCzC.jpg',
          },
          {
            category_name: 'Main Course ',
            category_image: 'istockphoto-1403973419-612x612.jpg',
          },
        ];

        await this.category.insertMany(payload);
        console.log('category sync successfully!');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
}
