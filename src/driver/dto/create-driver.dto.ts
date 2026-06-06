import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { DriverVerificationStatus } from '../schema/driver.schema';

export enum driverStatus {
  Online = 'online',
  offline = 'offline',
}

export enum UpdateStatus {
  Accept = 'accept',
  Reject = 'reject'
}

export enum Status {
  Past = 'past',
  Current = 'current'
}
export enum OrderStatus {
  Accept = 'accept',
  ReachedAtRestaurant = 'reached_at_restaurant',
  PickedUp = 'picked_up',
  ReachedAtdelivery = 'reached_at_delivery',
  Delivered = 'delivered',
}
export class CreateDriverDto { }

export class goOnlineDto {
  @ApiProperty({ required: false, enum: driverStatus })
  status: string;
}

export class OrderUpdateStatus {
  @ApiProperty()
  order_id: string;

  @ApiProperty({ required: false, enum: OrderStatus })
  status: string;
}
export class findDriverDto {
  @ApiProperty({
    default: 'active',
    enum: ['active', 'inactive', 'block',  "pending", 'deleted', 'expired'],
  })
  status: 'active' | 'inactive' | 'block' | 'pending'| 'expired' | 'deleted' = 'deleted';

  @ApiPropertyOptional()
  search?: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class orderListDto {

  @ApiProperty()
  driver_id: string;

  @ApiProperty({ enum: Status, default: Status.Current })
  status: Status;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class driverOrderListDto {
  @ApiProperty()
  driver_id: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}


export class payoutListDto {
  @ApiProperty({ required: false })
  driver_id?: string;

  @ApiProperty({ required: false })
  restaurant_id?: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}


export class findDriverRequestDto {

  @ApiProperty({
    default: 'pending',
    enum: ['pending', 'reject']
  })
  status: 'pending' | 'reject' = 'reject';

  @ApiPropertyOptional()
  search?: string;

  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number
}

export class findDriverUpdateRequestDto {

  @ApiPropertyOptional()
  search?: string;

  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number
}


export class SetExpiryDateDto {
  @ApiProperty()
  licence_expiry_date: number

}

export class DriverBlockDto {

  @ApiProperty()
  driver_id: string

  @ApiProperty({
    default: 'block',
    enum: ['block', 'unblock']
  })
  status: 'block' | 'unblock' = 'unblock';

  @ApiPropertyOptional()
  reason: string
}

export class UpdateDriveRequest {
  @ApiProperty()
  driver_id: string

  @ApiProperty({
    default: 'accept',
    enum: ['accept', 'reject', 'decline'],
  })
  status: 'accept' | 'reject' | 'decline' = 'reject';

  @ApiPropertyOptional()
  reason: string

  @ApiPropertyOptional({ default: false })
  is_update?: boolean;

  @ApiProperty({
    default: DriverVerificationStatus.SUBMITTED,
    enum: DriverVerificationStatus,
  })
  @ApiPropertyOptional()
  search: string;

}



export class Listing {
  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number
}


export class DriverVehicalList {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  driver_id: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class location {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  latitude: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  longitude: string;
}

export class driverListDto {

  @ApiProperty({ required: false })
  @IsOptional()
  search: string;
}

export class verifyOrder {
  @ApiProperty()
  order_id: string;

  @ApiProperty({
    default: 'delivered',
    enum: ['delivered'],
  })
  status: 'delivered';

  @ApiProperty()
  otp: string;
}