import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoyalityPointDto } from './dto/create-loyality-point.dto';
import { UpdateLoyalityPointDto } from './dto/update-loyality-point.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { Types } from 'mongoose';
import { LoyaltyPointType } from './entities/loyality-history.entity';
import { PaginationGetPointDto } from './dto/get-active-pagination.dto';
import { CustomerService } from 'src/customer/customer.service';
import { WalletTxnCreditType } from 'src/wallet/entities/wallet-transaction.entity';

@Injectable()
export class LoyalityPointsService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly CustomerService: CustomerService,
    
  ) { }

  async create(createLoyalityPointDto: CreateLoyalityPointDto) {
    const { is_active = true } = createLoyalityPointDto;

    // If the new one is active, deactivate previous active one
    if (is_active) {
      await this.model.loyaltySettingsModel.updateMany(
        { is_active: true },
        { $set: { is_active: false } },
      );
    }

    // Create the new setting
    const created = await this.model.loyaltySettingsModel.create(createLoyalityPointDto);

    return {
      statusCode: 201,
      message: 'Loyalty settings created successfully.',
      result: created,
    };
  }

  async getActiveSetting(paginationDto: PaginationGetPointDto) {
    const page = parseInt(paginationDto.page || '1');
    const limit = parseInt(paginationDto.limit || '10');
    const skip = (page - 1) * limit;

    const [settings, totalCount] = await Promise.all([
      this.model.loyaltySettingsModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 }),
      this.model.loyaltySettingsModel.countDocuments({ is_active: true }),
    ]);

    return {
      statusCode: 200,
      message: 'Active loyalty point settings fetched successfully.',
      result: {
        total: totalCount,
        page,
        limit,
        data: settings,
      },
    };
  }

  async getById(settingId: string) {
    const setting = await this.model.loyaltySettingsModel.findById(settingId);

    if (!setting) {
      throw new BadRequestException('Loyalty point setting not found.');
    }

    return {
      statusCode: 200,
      message: 'Loyalty point setting fetched successfully.',
      result: setting,
    };
  }

  async updateById(settingId: string, dto: UpdateLoyalityPointDto) {
    const updated = await this.model.loyaltySettingsModel.findByIdAndUpdate(
      settingId,
      { $set: dto },
      { new: true },
    );

    if (!updated) {
      throw new BadRequestException('Loyalty point setting not found.');
    }

    return {
      statusCode: 200,
      message: 'Loyalty point setting updated successfully.',
      result: updated,
    };
  }

  async getUserLoyaltyWallet(customerId: Types.ObjectId) {
    const wallet = await this.model.LoyaltyWalletModel.findOne({ customer_id: customerId });

    return {
      statusCode: 200,
      message: 'Loyalty wallet fetched successfully.',
      result: wallet || { balance: 0 },
    };
  }

  async getUserLoyaltyHistory(customerId: string, page: number, limit: number) {
    
    let customer = await this.model.customer.findById(customerId);
     
    
    const [history, total] = await Promise.all([
      this.model.loyaltyHistoryModel
        .find({ customer_id: customer._id })
        .populate({
          path: 'order_id',
          select: 'restaurant_id order_id',
          populate: {
            path: 'restaurant_id',
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.loyaltyHistoryModel.countDocuments({ customer_id: customer._id }),
    ]);



    const [result] = await this.model.loyaltyHistoryModel.aggregate([
      {
        $match : {
          customer_id: customer._id
        }
      }, 
      {
        $group: {
          _id: null,
          total: { $sum: "$points" }
        }
      }
    ])

    const total_point = result?.total??0;


    // const total_point = history.reduce((accumulator, h) => accumulator + h.points, 0);

    return {
      statusCode: 200,
      message: 'Loyalty history fetched successfully.',
      result: {
        data: history,
        total,
        page,
        limit,
        total_point,
      },
    };
  }

  async awardPoints(
    customerId: Types.ObjectId,
    order_id: Types.ObjectId | null,
    points: number,
    type: LoyaltyPointType = LoyaltyPointType.EARNED,
    note?: string,
  ) {

    this.CustomerService.handleWalletAmount(customerId,points, WalletTxnCreditType.Point, note);
    await this.model.loyaltyHistoryModel.create({
      customer_id: customerId,
      order_id: order_id,
      points,
      type,
      note,
    });
  }


   async manageReferralAfterFinalOrder(child_customer){

    if(child_customer){
      let parent_customer = await this.model.customer.findById(child_customer.referral_user);

      console.log("parent_customer ========", parent_customer);

      if(parent_customer){

        // increase oreder count 
        let currentOrder  = await this.model.CustomerReferralOrderModel.findOne({ 
          parent_customer_id :parent_customer._id,
          child_customer_id : child_customer._id
        });
        currentOrder.order_count = currentOrder.order_count + 1;
        await currentOrder.save();


        let referalOrders  = await this.model.CustomerReferralOrderModel.find({ parent_customer_id :parent_customer._id });

        // now check the conditons 
        // const appConfig = await this.model.appConfiguration.findOne();
        if(referalOrders.length >=  parent_customer.referral.number_of_persons){

          const flag = referalOrders.every(
            (val) => val.order_count >= parent_customer.referral.number_of_orders
          );

          console.log("send amount to wallet ============");
          if(flag === true){

            let note = "Referral bonus credited after referred user order";
            this.CustomerService.handleWalletAmount(parent_customer._id, parent_customer.referral.amount, WalletTxnCreditType.Referral, note);  
            
            await this.model.CustomerReferralOrderModel.deleteMany({ parent_customer_id :parent_customer._id });

          }
          return { referalOrders};
        }
      }
    }
    return {"message" : "outer"};
  }







}
