import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import * as moment from 'moment';
import { Types } from 'mongoose';
import { CreateOrderDto } from '../report/dto/create-order.dto';
import { PipelineStage } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(private readonly model: DbService, private readonly commonService: CommonService) { }
  async create(createReportDto: CreateReportDto, user_id) {
    try {
      let data = { ...createReportDto, user_id: user_id, status: 'pending' };
      let ccreate = await this.model.reports.create(data);
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async findAll(body) {
    try {
      const skip = (body.page - 1) * body.limit;

      let query = {};
      body.status === 'pending' ? (query = { reply_at: null }) : null;
      body.status === 'replied' ? (query = { reply_at: { $ne: null } }) : null;
      let data = await this.model.reports.find(query).sort({ _id: -1 }).skip(skip).limit(body.limit);
      let count = await this.model.reports.countDocuments(query)
      return { count, data: data };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      let data = await this.model.reports.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateReportDto: UpdateReportDto) {
    try {
      const timestamps = moment.utc().valueOf();
      const { reply } = updateReportDto;


      let report = await this.model.reports.findOne({ _id: id });

      

      if (!report) {
        return { message: "Report not found" };
      }

      let customer = await this.model.customer.findOne({ _id: report.user_id }, { email: 1 });


      const updateResult = await this.model.reports.updateOne(
        { _id: id },
        { $set: { reply: reply, reply_at: timestamps, status: "replied" } }
      );

      console.log(customer.email);

      if (customer?.email) {
        await this.commonService.sendmail(
          customer.email,
          "The admin has addressed your complaint.",
          reply, 
          reply
        );
      }

      return { message: "Your reply has been delivered successfully" };
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }
  async delete_reports(id: string) {
    try {

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException("Invalid report ID format", HttpStatus.BAD_REQUEST);
      }

      const report = await this.model.reports.deleteOne({ _id: id });

      return { message: "Complaint deleted successfully", data: report };
    } catch (error) {
      console.error("Delete error:", error.message);
      throw error;
    }
  }

  async orderComplaint(CreateOrderDto: CreateOrderDto, user_id) {
    try {
      let data = { ...CreateOrderDto, user_id: user_id, status: 'pending' };
      let ccreate = await this.model.reports.create(data);
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async getComplaints(body) {
    try {
      const limit = Number(body.limit);

      const skip = (body.page - 1) * limit;
      const query = { status: body.status };

      const pipeline: PipelineStage[] = [
        { $match: query },
        { $sort: { _id: -1 } },
        { $skip: skip },
        { $limit: limit },

        // Join restaurant data
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurant_id',
            foreignField: '_id',
            as: 'restaurant',
          },
        },

        // Join order data
        {
          $lookup: {
            from: 'reportreasons',
            localField: 'report_reason_id',
            foreignField: '_id',
            as: 'reportreasons',
          },
        },
        // Join order data
        {
          $lookup: {
            from: 'orders',
            localField: 'order_id',
            foreignField: '_id',
            as: 'order',
          },
        },

        {
          $lookup: {
            from: 'customers',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },



        // Flatten the joined arrays
        {
          $addFields: {
            restaurant: { $arrayElemAt: ['$restaurant', 0] },
            order: { $arrayElemAt: ['$order', 0] },
            customer_name: { $arrayElemAt: ['$user.name', 0] }, // ✅ add this
            customer_email: { $arrayElemAt: ['$user.email', 0] }, // ✅ add this
            customer_phone: { $arrayElemAt: ['$user.phone', 0] }, // ✅ add this
            country_code: { $arrayElemAt: ['$user.country_code', 0] }, // ✅ add this

          },
        },
        {
          $addFields: {
            type: {
              $cond: [
                { $ifNull: ['$restaurant_id', false] },
                'restaurant',
                {
                  $cond: [{ $ifNull: ['$order_id', false] }, 'order', null],
                },
              ],
            },
            name: {
              $cond: [
                { $ifNull: ['$restaurant_id', false] },
                '$restaurant.restaurant_name', null,

              ],
            },
            orderId: {
              $cond: [
                { $ifNull: ['$order_id', false] },
                '$order.order_id',
                null,
              ],
            },
          }
        },

        // Optional: remove joined fields
        {
          $project: {
            restaurant: 0,
            order: 0,
            user: 0,
          },
        },
      ];

      const data = await this.model.reports.aggregate(pipeline);
      const count = await this.model.reports.countDocuments(query);

      return { count, data };
    } catch (error) {
      throw error;
    }
  }

  async delete_complaint(id: string) {
    try {

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException("Invalid report ID format", HttpStatus.BAD_REQUEST);
      }

      const report = await this.model.reports.deleteOne({ _id: id });

      return { message: "Complaint deleted successfully", data: report };
    } catch (error) {
      console.error("Delete error:", error.message);
      throw error;
    }
  }
  async updateComplaint(id: string, updateReportDto: UpdateReportDto) {
    try {
      const timestamps = moment.utc().valueOf();
      const { reply, status } = updateReportDto;

      const [report, customer] = await Promise.all([
        this.model.reports.findOne({ _id: id }),
        this.model.customer.findOne({ _id: id }, { email: 1 }),
      ]);

      if (!report) {
        return { message: "Report not found" };
      }

      const updateResult = await this.model.reports.updateOne(
        { _id: id },
        //  { $set: { reply: reply, reply_at: timestamps, status: "replied" } },
        { $set: { reply: reply, reply_at: timestamps, status: status } },
      );

      if (customer?.email) {
        await this.commonService.sendmail(
          customer.email,
          "The admin has addressed your complaint.",
          reply,
          reply
        );
      }

      return { message: "Your reply has been delivered successfully" };
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }
}
