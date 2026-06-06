import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import pLimit from 'p-limit';
import { VendorService } from 'src/vendor/vendor.service';
import { EarningService } from 'src/earning/earning.service';
import { OrderService } from 'src/order/order.service';
import { SlotService } from 'src/slot/slot.service';
import { AdminService } from 'src/admin/admin.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

@Injectable()
export class JobsService {
  private readonly limit; // max 5 tenants at a time

  constructor(
    @InjectQueue('cron-queue')
    private readonly emailQueue: Queue,
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly vendorService: VendorService,
    private readonly earningService: EarningService,
    private readonly orderService: OrderService,
    private readonly slotService: SlotService,

    private readonly adminService: AdminService,
    private readonly subscriptionsService: SubscriptionsService,

  ) {
      this.limit = pLimit(5);
  
  }

  autoAcceptOrderAfter31SecQueue() {
    this.emailQueue.add(
      'auto-accept-order',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }
  async handleAutoAcceptOrder(data: any) {
    try {

      console.log("=====================================", "handleAutoAcceptOrder");

      const getTenantDBUrls = await this.commonService.getTenantDBUrls();

      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {


              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              console.log('Processing job:===========');

              // console.log("tenant.database == ", tenant.databaseUrl, tenant.database)

              // your logic
              await this.vendorService.autoAcceptOrderAfter31Sec();
              await this.vendorService.updateDiscountOnRestaurantItems();

            })
          )
        )        
      }

    }catch (error){
      console.log('Error in handleAutoAcceptOrder:', error);
    }
  }



  ActiveDriverAfterOneHourQueue(){
    this.emailQueue.add(
      'active-driver-after-one-hour',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }
  
  async handleActiveDriverAfterOneHour(data: any) {
  
    console.log("=====================================", "handleActiveDriverAfterOneHour");
  
    // handle multiple db in cron 
    const getTenantDBUrls = await this.commonService.getTenantDBUrls();
    if (getTenantDBUrls && getTenantDBUrls.length > 0) {
      await Promise.all(
        getTenantDBUrls.map((tenant) =>
          this.limit(async () => {
            await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

            // your logic
            await this.vendorService.ActiveDriverAfterOneHour();
          })
        )
      )
    }
  }


  moneyTransferQueue(){
    this.emailQueue.add(
      'money-transfer',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }
   
  async handleMoneyTransfer(){
    console.log("=====================================", "handleMoneyTransfer");

      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.earningService.moneyTransfer();

            })
          )
        )
      }
  }


  async cancelPendingOrdersQueue(){
    this.emailQueue.add(
      'cancel-pending-orders',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }


  async handleCancelPendingOrders(){
    console.log("=====================================", "handleCancelPendingOrders");
  
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.orderService.cancelPendingOrders();
  
            })
          )
        )
     
      }
  }


  async handleTrandingFoodItemQueue(){
    this.emailQueue.add(
      'handle-tranding-food-item',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async handleTrandingFoodItem(){
    console.log("=====================================", "handleTrandingFoodItem");
  
    const getTenantDBUrls = await this.commonService.getTenantDBUrls();
    if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.vendorService.handleTrandingFoodItem();

            })
          )
        )
        
      }
  }


  async sendDailyWishesQueue(){
    this.emailQueue.add(
      'send-daily-wishes',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async sendDailyWishes(){
    console.log("=====================================", "sendDailyWishes");
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.commonService.sendDailyWishes();

            })
          )
        )
        
      }

  }


  async createSlotQueue(){
    this.emailQueue.add(
      'create-slot',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async createSlot(){
    console.log("=====================================", "createSlot");

      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.slotService.createSlotByCron();

            })
          )
        )
      
      }

  }

  async db_backupQueue(){
    this.emailQueue.add(
      'db-backup',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }


  async db_backup(){
    console.log("=====================================", "db_backup");

      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              if(process.env.ENVIROMENT === "live"){
                let data = await this.model.backup_case_1();
              }

            })
          )
        ) 
      }
  }


  async CreateUpcommingOrdersQueue(){
    this.emailQueue.add(
      'create-upcomming-orders',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async CreateUpcommingOrders(){
    console.log("=====================================", "CreateUpcommingOrders");

    // handle multiple db in cron 
    const getTenantDBUrls = await this.commonService.getTenantDBUrls();
    if (getTenantDBUrls && getTenantDBUrls.length > 0) {
      await Promise.all(
        getTenantDBUrls.map((tenant) =>
          this.limit(async () => {
            await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

            // your logic
            await this.orderService.CreateUpcommingOrders();

          })
        )
      )
      
    }

  }

  async HandleUpcommingOrdersQueue(){
    this.emailQueue.add(
      'handle-upcomming-orders',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async HandleUpcommingOrders(){
    console.log("=====================================", "HandleUpcommingOrders");
  
      // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.orderService.HandleUpcommingOrders();
              await this.orderService.HandleScheduledOrders();

            })
          )
        )
        
      }
  }


  async sendCloudNotificationQueue(){
    this.emailQueue.add(
      'send-cloud-notification',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }


  async sendCloudNotification(){
    console.log("=====================================", "sendCloudNotification");

      // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.adminService.sendCloudNotificationCron();

            })
          )
        )
        
      }


  }


  async createDailySubscriptionOrdersQueue(){
    this.emailQueue.add(
      'create-daily-subscription-orders',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async createDailySubscriptionOrders(){
    console.log("=====================================", "createDailySubscriptionOrders");
  

      // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.subscriptionsService.createDailySubscriptionOrders();
              

            })
          )
        )
        
      }
  
  }

  async placeSubscriptionOrdersAtMealTimeQueue(){
    this.emailQueue.add(
      'place-subscription-orders-at-meal-time',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }

  async placeSubscriptionOrdersAtMealTime(){
    console.log("=====================================", "placeSubscriptionOrdersAtMealTime");
    const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.subscriptionsService.placeOrdersAtMealTime();

            })
          )
        )        
      }

  }

  async handleAssignFixedTimeOrderTotheDriverQueue(){
    this.emailQueue.add(
      'handle-assign-fixed-time-order-tothe-driver',
      {},
      {
        attempts: 3,
        delay: 31000,
        removeOnComplete: true,
      },
    );
  }
  
  async handleAssignFixedTimeOrderTotheDriver(){
    console.log("=====================================", "handleAssignFixedTimeOrderTotheDriver"); 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);
              // your logic
              await this.orderService.assignFixedTimeOrderTotheDriverByCron();
            })
          )
        )
      }
  }
}