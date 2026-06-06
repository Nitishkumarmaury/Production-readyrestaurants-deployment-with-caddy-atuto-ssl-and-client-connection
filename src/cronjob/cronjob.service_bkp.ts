import { Injectable } from '@nestjs/common';
import { VendorService } from '../vendor/vendor.service';
import { Cron } from '@nestjs/schedule';
import { EarningService } from '../earning/earning.service';
import { OrderService } from '../order/order.service'
import { DriverService } from '../driver/driver.service';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { SlotService } from 'src/slot/slot.service';
import { AdminService } from 'src/admin/admin.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import pLimit from 'p-limit';


@Injectable()
export class CronjobService {

  private readonly limit; // max 5 tenants at a time


  constructor(
    private readonly model: DbService,
    private readonly vendorService: VendorService,
    private readonly earningService: EarningService,
    private readonly orderService: OrderService,
    private readonly driverService: DriverService,
    private readonly commonService: CommonService,
    private readonly SlotService: SlotService,
    private readonly AdminService: AdminService,
    private readonly subscriptionsService: SubscriptionsService

  ) { 

    this.limit = pLimit(5);

  }
  
  @Cron('*/30 * * * * *') // This runs every 30 seconds
  async handleCron() {
    try {

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

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  // @Cron('0 11 * * 0')
  // @Cron('* * * * *')
  
  
  // Runs every Sunday at 11:00 AM
  @Cron('0 11 * * 0')
  async handleCron1() {
    try {

      // handle multiple db in cron 
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

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('*/5 * * * * *') // This runs every 5 seconds
  async handleCron2() {
    try {
       // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.vendorService.autoAcceptOrderAfter31Sec();
              await this.vendorService.updateDiscountOnRestaurantItems();
            })
          )
        )        
      }
    
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('0 6 * * *') // every day 6 am
  async handlePendingOrders() {
    try {

      // handle multiple db in cron 
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


    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  // @Cron('*/5 * * * * *')
  // async handleCron3() {
  //   try {
  //     await this.driverService.check_Expiry_date(); // Added parentheses to call the method
  //   } catch (error) {
  //     console.error('Error occurred:', error.message);
  //   }
  // }


    @Cron('0 4 * * 0') //  every Sunday at 4:00 AM
  async handleTrandingFoodItem() {
    try {
      // handle multiple db in cron 
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

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('0 10 * * *')  // runs daily at 10 AM
  async sendDailyWishes() {

      // handle multiple db in cron 
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


  @Cron('0 3 * * *') // This runs every  day 3 am
  async createSlot() {
    try {

      // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.SlotService.createSlotByCron();

            })
          )
        )
        
      }

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 2 * * *') // This runs daily 2.00 am
  async db_backup() {
  try {

     // handle multiple db in cron 
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


     
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }



  @Cron('0 0 * * *') //  run daily at 12:00 midnight	
  async CreateUpcommingOrders() {
    try {

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

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('0 */5 * * * *')	
  async HandleUpcommingOrders() {
    try {

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

      
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  
  @Cron('0 8 * * *') // This runs daily 8.00 am
  async sendCloudNotification() {
    try {

      // handle multiple db in cron 
      const getTenantDBUrls = await this.commonService.getTenantDBUrls();
      if (getTenantDBUrls && getTenantDBUrls.length > 0) {
        await Promise.all(
          getTenantDBUrls.map((tenant) =>
            this.limit(async () => {
              await this.model.create_tenant_connection(tenant.databaseUrl, tenant.database);

              // your logic
              await this.AdminService.sendCloudNotificationCron();

            })
          )
        )
        
      }


    

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }



  @Cron('5 0 * * *') // Runs daily at 12:05 AM
  async createDailySubscriptionOrders() {
    try {


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


    } catch (error) {
      console.error(' Error creating daily subscription orders:', error.message);
    }
  }

  //   Place subscription orders at meal time (every 3 minutes)
  @Cron('*/3 * * * *') // Runs every 3 minutes
  async placeSubscriptionOrdersAtMealTime() {
    try {

      // handle multiple db in cron 
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
      
    } catch (error) {
      console.error(' Error placing subscription orders:', error.message);
    }
  }

  @Cron('0 5 0 * * *')// This runs 12:05 AM every day
  async handleAssignFixedTimeOrderTotheDriverByCron () {
    try {

      // handle multiple db in cron 
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
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

}
