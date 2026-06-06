import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { GetNotificationListDto, SortByValues, SortOrder } from './dto/get-notification-list.dto';
import mongoose from 'mongoose';
import { checkAndGenerateUniqueId } from 'src/utils/notification-common';
import { BadRequestError } from 'openai';

@Injectable()
export class NotificationService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
  ) { }

  async createNotification(notificationDto: CreateNotificationDto, userId: string) {
    const uniqueId = await checkAndGenerateUniqueId(
      this.model.NotificationModel,
      'NF',
      'data.uniqueId', // store unique ID inside the data object
    );

    const notificationPayload = {
      ...notificationDto,
      userId: new mongoose.Types.ObjectId(userId),
      data: {
        ...notificationDto.data,
        uniqueId, // put the generated ID inside data
      },
    };

    return await this.model.NotificationModel.create(notificationPayload);
  }

  async getNotificationList(dto: GetNotificationListDto, req: any) {
    const {
      pageNumber = 1,
      count = 10,
    } = dto;

    const skip = (pageNumber - 1) * count;
    try {
        let user = req?.user?? null;
        if(!user){
          throw new BadRequestException("user not found")
        }

        const unreadQuery = { userId: user._id, isRead: false, isDeleted: false };
        const readQuery = { userId: user._id, isRead: true, isDeleted: false };

        const [unreadData, unreadTotal, readData, readTotal] = await Promise.all([

          this.model.NotificationModel
            .find(unreadQuery)
            .populate({
              path: 'userId',
              select: 'name email phone image country_code',
            })
            .populate({
              path: 'resturantId',
              select: 'restaurant_name email restaurant phone image country_code',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(count)
            .lean(),
          
          this.model.NotificationModel.countDocuments(unreadQuery),
          
          this.model.NotificationModel
            .find(readQuery)
            .populate({
              path: 'userId',
              select: 'name email phone image country_code',
            })
            .populate({
              path: 'resturantId',
              select: 'restaurant_name email restaurant phone image country_code',

            })
            .sort({ createdAt: -1 }) // default latest first
            .skip(skip)
            .limit(count)
            .lean(),
          
            this.model.NotificationModel.countDocuments(readQuery),
        ]);

        return {
          unread: {
            total: unreadTotal,
            pageNumber,
            count,
            data: unreadData,
          },
          read: {
            total: readTotal,
            pageNumber,
            count,
            data: readData,
          },
        };
    }catch (e) {
      throw e
    }
  }


  async markAsRead(notificationId: string) {
    const updatedNotification = await this.model.NotificationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(notificationId) },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!updatedNotification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      message: 'Notification marked as read.',
      data: updatedNotification,
    };
  }

  async markAllAsRead(user: any) {
    const updateResult = await this.model.NotificationModel.updateMany(
      { userId: new mongoose.Types.ObjectId(user._id) },
      { $set: { isRead: true } },
      { new: true }
    );

    return {
      success: true,
      message: `${updateResult.modifiedCount} notifications marked as read.`,
      modifiedCount: updateResult.modifiedCount,
    };
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.model.NotificationModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId)
    });
  }

  async deleteAllNotifications(userId: string) {
    return this.model.NotificationModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId)
    });
  }


}
