import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, Request, UseGuards, HttpException, HttpStatus, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetNotificationListDto } from './dto/get-notification-list.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';

@Controller('notificationr')
@ApiTags('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get('/notification-list')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the list of notifications' })
  async getNotificationList(
    @Query() getNotificationListDto: GetNotificationListDto,
    @Request() req : any
  ) {
    try {
      const result = await this.notificationService.getNotificationList(
        getNotificationListDto,
        req,
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Put('/mark-as-read/:notificationId')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiParam({
    name: 'notificationId',
    type: 'string',
  })
  async markAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    try {
      const result = await this.notificationService.markAsRead(notificationId);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Failed to update',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('/mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notification as read by user Id.' })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async markAllAsRead(
    @Request() req
  ) {
    try {
      const result = await this.notificationService.markAllAsRead(req.user);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Failed to update',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Delete('delete-notification/:notificationId')
  @ApiOperation({ summary: 'Delete notification by ID' })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'notificationId', type: 'string' })
  async deleteNotification(
    @Param('notificationId') notificationId: string,
    @Request() req
  ) {
    try {
      const result = await this.notificationService.deleteNotification(notificationId, req.user._id);
      return { message: 'Notification deleted successfully', data: result };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Failed to delete notification',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete-all-notifications')
  @ApiOperation({ summary: 'Delete all notifications for logged-in user' })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async deleteAllNotifications(@Request() req) {
    try {
      const result = await this.notificationService.deleteAllNotifications(req.user._id);
      return { message: 'All notifications deleted successfully', deletedCount: result.deletedCount };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Failed to delete all notifications',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
