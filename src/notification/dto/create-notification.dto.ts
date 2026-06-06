import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushNotificationObj {
  @ApiProperty({ example: 'Order Update', description: 'Title of the push notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your order #123 has been shipped.', description: 'Body message of the push notification' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

class PushNotificationDataObj {
  @ApiProperty({ example: 'order', description: 'Module name that triggered the notification' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ example: '/orders/123', description: 'Frontend path to redirect when notification is clicked' })
  @IsString()
  @IsNotEmpty()
  redirectPath: string;

  @ApiProperty({ example: '123', description: 'Unique identifier for the entity related to the notification' })
  @IsString()
  @IsNotEmpty()
  uniqueId: string;
}

export class CreateNotificationDto {
  @ApiProperty({ type: PushNotificationObj, description: 'Notification title and body' })
  @ValidateNested()
  @Type(() => PushNotificationObj)
  notification: PushNotificationObj;

  @ApiProperty({ type: PushNotificationDataObj, description: 'Additional data for the notification' })
  @ValidateNested()
  @Type(() => PushNotificationDataObj)
  data: PushNotificationDataObj;

  @ApiProperty({ example: false, description: 'Read status of the notification', default: false })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean = false;

  @ApiProperty({ example: '64c1f2ab5e4f2b0012345678', description: 'MongoDB ObjectId of the recipient user' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
