import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsService } from './jobs.service';

@Processor('cron-queue')
export class JobsProcessor {

    constructor(
        private readonly jobsService: JobsService,
        
    ) { }

  @Process('auto-accept-order')
  async handleAutoAcceptOrderProcess(job: Job) {
    
    await this.jobsService.handleAutoAcceptOrder(job.data);
    // email logic here

    return true;
  }



  @Process('active-driver-after-one-hour')
  async handleActiveDriverAfterOneHourProcess(job: Job) {
    
    await this.jobsService.handleActiveDriverAfterOneHour(job.data);
    // email logic here

    return true;
  }



  @Process('money-transfer')
  async handleMoneyTransferProcess(job: Job) {
    
    await this.jobsService.handleMoneyTransfer();
    // email logic here

    return true;
  }

  @Process('cancel-pending-orders')
  async handleCancelPendingOrdersProcess(job: Job) {
    
    await this.jobsService.handleCancelPendingOrders();
    // email logic here

    return true;
  }


  @Process('tranding-food-item')
  async handleTrandingFoodItemProcess(job: Job) {
    
    await this.jobsService.handleTrandingFoodItem();
    // email logic here

    return true;
  }


  @Process('send-daily-wishes')
  async handleSendDailyWishesProcess(job: Job) {
    
    await this.jobsService.sendDailyWishes();
    // email logic here

    return true;
  }


  @Process('create-slot')
  async handleCreateSlotProcess(job: Job) {
    
    await this.jobsService.createSlot();
    // email logic here

    return true;
  }



  @Process('db-backup')
  async handleDbBackupProcess(job: Job) {
    
    await this.jobsService.db_backup();
    // email logic here

    return true;
  }

  @Process('create-upcomming-orders')
  async handleCreateUpcommingOrdersProcess(job: Job) {
    
    await this.jobsService.CreateUpcommingOrders();
    // email logic here

    return true;
  }

  @Process('handle-upcomming-orders')
  async handleUpcommingOrdersProcess(job: Job) {
    
    await this.jobsService.HandleUpcommingOrders();
    // email logic here

    return true;
  }


  @Process('send-cloud-notification')
  async handleSendCloudNotificationProcess(job: Job) {
    
    await this.jobsService.sendCloudNotification();
    // email logic here

    return true;
  }


  @Process('create-daily-subscription-orders')
  async handleCreateDailySubscriptionOrdersProcess(job: Job) {
    
    await this.jobsService.createDailySubscriptionOrders();
    // email logic here

    return true;
  }


  @Process('place-subscription-orders-at-meal-time')
  async handlePlaceSubscriptionOrdersAtMealTimeProcess(job: Job) {
    
    await this.jobsService.placeSubscriptionOrdersAtMealTime();
    // email logic here

    return true;
  }

  @Process('handle-assign-fixed-time-order-tothe-driver')
  async handleAssignFixedTimeOrderTotheDriverProcess(job: Job) {
    
    await this.jobsService.handleAssignFixedTimeOrderTotheDriver();
    // email logic here

    return true;
  }



}