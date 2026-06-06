import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateReferralDto, PaginationAdminListDto, PaginationDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Referral, ReferralDocument } from './entities/referral.entity';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ReferralsService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService
  ) { }

  async generateCampaignCode() {
    try {
      return Math.floor(1000 + Math.random() * 9000);
    } catch (error) {
      throw error;
    }
  }

  async create(createRefralDto: CreateReferralDto) {
    try {
      let generateRefCode = await this.generateCampaignCode()
      let createRefral = await this.model.referralModel.create({ ...createRefralDto, is_active: true, created_at: moment.utc().valueOf(), camp_code: generateRefCode });
      await this.model.referralModel.updateMany({ _id: { $ne: createRefral._id } }, { is_active: false });
      return { message: "Refral create successfully." }
    }
    catch (error) {
      throw error;
    }
  }

  async findAll(dto: PaginationAdminListDto) {
    let options = await this.commonService.set_options(dto.page, dto.limit);
    let query = {
      type: "DRIVER"
    }
    if (dto.status == "customers_referral_info") query.type = "CUSTOMER";
    let data = await this.model.referralModel.find(query, { __v: 0 }, options).sort({ created_at: -1 })
    let count = await this.model.referralModel.countDocuments(query);
    return { data: data, count: count };
  }

  fetchDiffInDays = async (timestampMs) => {
    try {
      const today = moment.utc().startOf('day'); // current date at midnight
      const targetDate = moment(timestampMs).startOf('day'); // provided date at midnight

      return today.diff(targetDate, 'days'); // can be positive or negative
    }
    catch (error) {
      throw error;
    }
  }

  addDaysToDate = async (timestampMs, numberOfDays) => {
    try {
      const updatedDate = moment(timestampMs).add(numberOfDays, 'days');
      console.log(updatedDate, "++++++++++updatedDate");

      return updatedDate.valueOf(); // return as timestamp in milliseconds
    } catch (error) {
      throw error;
    }
  }

  fetchRefralStatusAndDatesForCustomer = async (user, bookingCount) => {
    try {
      let status = "PENDING";
      let valid_upto = null;
      let pending_no_of_days = null;
      let completed_at = null;
      let expired_at = await this.addDaysToDate(user?.created_at, user?.referral_id?.no_of_days_for_cus);
      let numberOfDays = await this.fetchDiffInDays(user?.created_at);

      if (user?.referral_id?.no_of_days_for_cus >= numberOfDays) {

        if (bookingCount?.length >= user?.referral_id?.cus_ref_cond_no) {
          status = "COMPLETED"
          completed_at = bookingCount[0].created_at;
        } else {
          status = "PENDING";
          pending_no_of_days = user?.referral_id?.no_of_days_for_cus - numberOfDays;
          valid_upto = await this.addDaysToDate(user?.created_at, user?.referral_id?.no_of_days_for_cus)
        }
      }
      if (user?.referral_id?.no_of_days_for_cus < numberOfDays) {
        if (bookingCount?.length >= user?.referral_id?.cus_ref_cond_no) {
          status = "COMPLETED"
          completed_at = bookingCount[0].created_at;
        } {
          status = "EXPIRED"
        }
      }
      return {
        status,
        valid_upto,
        pending_no_of_days,
        completed_at,
        expired_at,
      }
    } catch (error) {
      throw error;
    }
  }

  async fetchReferrals(user_id: string, scope: string, query: PaginationDto) {
    try {
      const { page, limit } = query;
      let skip = (page -1) * limit;
      if (scope !== 'customer') {
        throw new BadRequestException('Only customers can view referral history');
      }

      let customer = await this.model.customer.findById(user_id);

      let filter = {
        parent_customer_id : customer._id
      }

      let totalCount = await this.model.CustomerReferralOrderModel.countDocuments(filter);
      let history = await  this.model.CustomerReferralOrderModel.find(filter)
      .populate({path : "child_customer_id" , select : "name email country_code phone image"})
      .limit(limit)
      .skip(skip);

      return {
        statusCode: 200,
        message: 'Referral history fetched successfully',
        data: history,
        total : totalCount

      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Something went wrong');
    }
  }

  // FIND ONE
  async findOne(id: string) {
    const referral = await this.model.referralModel.findById(id);
    if (!referral) throw new BadRequestException('Referral not found');
    return { data: referral };
  }

  async setActive(id: string) {
    const target = await this.model.referralModel.findById(id);
    if (!target) throw new BadRequestException('Referral not found');
    await this.model.referralModel.updateMany({ type: target.type }, { is_active: false });
    let message = 'Referral marked as inactive.'
    if (!target.is_active) {
      await this.model.referralModel.findByIdAndUpdate(id, { is_active: true });
      message = 'Referral marked as active.'
    }
    return { message };
  }


}
