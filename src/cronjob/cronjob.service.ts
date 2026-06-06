import { Injectable } from '@nestjs/common';
import { VendorService } from '../vendor/vendor.service';
import { Cron } from '@nestjs/schedule';

// import { EarningService } from '../earning/earning.service';
// import { OrderService } from '../order/order.service'
// import { DriverService } from '../driver/driver.service';

import { DbService } from 'src/db/db.service';

// import { CommonService } from 'src/common/common.service';
// import { SlotService } from 'src/slot/slot.service';
// import { AdminService } from 'src/admin/admin.service';
// import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

import pLimit from 'p-limit';
import { JobsService } from 'src/jobs/jobs.service';


@Injectable()
export class CronjobService {

  private readonly limit; // max 5 tenants at a time


  constructor(
    private readonly model: DbService,

    // private readonly vendorService: VendorService,

    // private readonly earningService: EarningService,
    // private readonly orderService: OrderService,
    // private readonly driverService: DriverService,
    // private readonly commonService: CommonService,
    // private readonly SlotService: SlotService,
    // private readonly AdminService: AdminService,
    // private readonly subscriptionsService: SubscriptionsService,
    private readonly jobsService: JobsService,
  ) { 
    this.limit = pLimit(5);
  }
  
  
  @Cron('*/5 * * * * *') // This runs every 5 seconds
  async autoAcceptOrderAfter31Sec() {
    await this.jobsService.autoAcceptOrderAfter31SecQueue();
  }

  @Cron('*/30 * * * * *') // This runs every 30 seconds
  async ActiveDriverAfterOneHour() {
    try {
      await this.jobsService.ActiveDriverAfterOneHourQueue();

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  
  @Cron('0 11 * * 0') // Runs every Sunday at 11:00 AM
  async moneyTransfer() {
    try {
      await this.jobsService.moneyTransferQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('0 6 * * *') // every day 6 am
  async cancelPendingOrders() {
    try {
      await this.jobsService.cancelPendingOrdersQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }
  

  @Cron('0 4 * * 0') //  every Sunday at 4:00 AM
  async handleTrandingFoodItem() {
    try {
      await this.jobsService.handleTrandingFoodItemQueue();

    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 10 * * *')  // runs daily at 10 AM
  async sendDailyWishes() {
    try {
      await this.jobsService.sendDailyWishesQueue();
    }catch(error){
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 3 * * *') // This runs every  day 3 am
  async createSlot() {
    try {
      await this.jobsService.createSlotQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 2 * * *') // This runs daily 2.00 am
  async db_backup() {
    try {

      await this.jobsService.db_backupQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('0 0 * * *') //  run daily at 12:00 midnight	
  async CreateUpcommingOrders() {
    try {
      await this.jobsService.CreateUpcommingOrdersQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 */5 * * * *')	
  async HandleUpcommingOrders() {
    try {
      await this.jobsService.HandleUpcommingOrdersQueue();


    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  @Cron('0 8 * * *') // This runs daily 8.00 am
  async sendCloudNotification() {
    try {

      await this.jobsService.sendCloudNotificationQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }

  @Cron('5 0 * * *') // Runs daily at 12:05 AM
  async createDailySubscriptionOrders() {
    try {
      await this.jobsService.createDailySubscriptionOrdersQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


  //   Place subscription orders at meal time (every 3 minutes)
  @Cron('*/3 * * * *') // Runs every 3 minutes
  async placeSubscriptionOrdersAtMealTime() {
    try {
      await this.jobsService.placeSubscriptionOrdersAtMealTimeQueue();
    } catch (error) {
      console.error('Error occurred:', error.message);
    }
  }


    @Cron('0 5 0 * * *')// This runs 12:05 AM every day
  async handleAssignFixedTimeOrderTotheDriverByCron () {
    try {
      await this.jobsService.handleAssignFixedTimeOrderTotheDriverQueue();
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
}
