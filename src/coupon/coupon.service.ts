import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { DbService } from "src/db/db.service";
import { CommonService } from "src/common/common.service";
import { CouponAggregation } from "./coupon.aggregation";
import * as  moment from "moment";

@Injectable()
export class CouponService {
  constructor(private readonly model: DbService,private readonly commonService:CommonService,private readonly couponAggregation:CouponAggregation) {}
  async createForVendor(body, vendor_id, restaurant_id) {
    try {
      let data = { ...body, vendor_id, restaurant_id };
      const find_same_name_coupon = await this.model.coupon.findOne({
        code: body.code,
      });
      if (find_same_name_coupon) {
        throw new HttpException(
          {
            error_code: 'same_code_coupon_already_added',
            error_description: ' Coupon code already added.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      let add = await this.model.coupon.create(data);
      return { data: data };
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }


  async create(createCouponDto: CreateCouponDto) {
    try {
    
      const find_same_name_coupon = await this.model.coupon.findOne({
        code: createCouponDto.code,
      });
      if (find_same_name_coupon) {
        throw new HttpException(
          {
            error_code: 'same_code_coupon_already_added',
            error_description: ' Coupon code already added.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const add_coupon = await this.model.coupon.create(createCouponDto);
      return { message: 'Coupon add successfully' };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async findAll(body) {
    try {
      let options = await this.commonService.set_options(body.page, body.limit);
      let all_coupons=await this.model.coupon.find();
      for(const coupons of all_coupons){
        let current_date: any = moment.utc().startOf('day').valueOf();


        console.log("current_date...........",current_date);
        // let valid_upto_end_day = moment(coupons.valid_upto).endOf('day').valueOf()
        console.log("ff",coupons.valid_upto);
        // console.log("ff",valid_upto_end_day);
        if(coupons.valid_upto < current_date){
          await this.model.coupon.updateOne({_id:coupons._id},{status:"deactive"})
        }
      }
      let data_to_aggregate = [];
      if (body.status === 'available_on_phone') {
        data_to_aggregate = [
          await this.couponAggregation.AvailableInPhoneMatch(),
          await this.couponAggregation.AvailableInPhoneproject(),
          await this.couponAggregation.face_set(options),
        ];
      } else if (body.status === 'shared') {
        data_to_aggregate = [
          await this.couponAggregation.SharedMatch(),
          await this.couponAggregation.AvailableInPhoneproject(),
          await this.couponAggregation.face_set(options),
        ];   
      } else if (body.status === 'shared_used') {
        data_to_aggregate = [
          await this.couponAggregation.SharedusedMatch(),
          await this.couponAggregation.SharedUsedLoopup(),
          await this.couponAggregation.SharedUsedproject(),
          await this.couponAggregation.face_set(options),
        ];
      }
      const data = await this.model.coupon.aggregate(data_to_aggregate).exec();
      return { count: data[0]?.count[0]?.count, data: data[0]?.data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }



  async findOne(id: string) {
    try {
      const data = await this.model.coupon.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async update(id, body,user_info) {
    try {
      const update = await this.model.coupon.updateOne({ _id: id }, body);
      const key = 'coupon_update';
      const localization = await this.commonService.localization(key);
      return { message: localization[user_info.preferred_language] };
    } catch (error) {
      throw error;
    }
  }

  async update_status(body) {
    try {
      const data = await this.model.coupon.findOneAndUpdate({ _id: body.id }, { status: body.status === 'active' ? "active" : "deactive" }, { new: true })
      return { message: "Status updated", data }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async remove(id, user_info: any) {
    try {
      const delete_data = await this.model.coupon.deleteOne({ _id: id });
      const key = 'coupon_delete';
      const localization = await this.commonService.localization(key);
      return { message: localization["english"] };

    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }


}
