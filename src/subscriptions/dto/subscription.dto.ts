import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, IsUrl, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionItemStatus {
  Active = "active",
  NotActive = "not_active"
}



export enum SubscripitionStatus {
  Active = "active",
  Pause = "pause",
  Cancelled = "cancelled"
}

export enum MealType {
  Veg = 'veg',
  NonVeg = 'non_veg',
  Egg = 'egg',
}

export enum PlanDuration {
  Weekdays = 'weekdays',
  Weekend = 'weekend',
  Custom = 'custom',
}


export enum OrderSubscripitionStatus {
  Pending = 'pending',
  Placed = 'placed',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Upcomming = 'upcomming',
}


export class DeliveryAddress {
  @ApiProperty({ example: '531, Sector 20A' })
  name: string;

  @ApiProperty({ example: '30.72765964702996' })
  lat: string;


  @ApiProperty({ example: '76.78958918799881' })
  long: string;

  @ApiProperty({ example: '531' })
  building_no: string;

  @ApiProperty({ example: '' })
  tower: string;

  @ApiProperty({ example: 'Sector 20' })
  area: string;


  @ApiProperty({ example: 'Chandigarh' })
  city: string;

  @ApiProperty({ example: '' })
  nearby_landmark: string;

  @ApiProperty({ example: 'home' })
  type: string;
}


export class UpdateSubscriptionStatusDto {

  @ApiProperty({
    description: 'ID of the subscription to update',
    example: '69242a32c165525899cd98b4',
  })
  @IsString()
  id: string;


  @ApiProperty({
    description: 'New status for the subscription',
    enum: SubscripitionStatus,
    example: SubscripitionStatus.Active,
  })
  @IsEnum(SubscripitionStatus, {
    message: 'Status must be Active, Paused, or Cancelled',
  })
  status: SubscripitionStatus;
}


export class listSubscriptionDto {

  @ApiPropertyOptional({
    description: 'Filter subscription by status',
    enum: SubscripitionStatus,
    example: SubscripitionStatus.Active,
  })
  @IsOptional()
  @IsEnum(SubscripitionStatus, {
    message: 'Status must be Active, Paused, or Cancelled',
  })
  status?: SubscripitionStatus;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Limit number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  

  @ApiPropertyOptional({
    description: 'Customer ID or Restaurant ID (Admin only)',
    example: '69242dbf06bd48bafa7223b1',
  })
  @IsOptional()
  @IsString({
    message: 'id must be a valid MongoDB ObjectId',
  })
  id?: string;


  @ApiPropertyOptional({
    description: 'Search term to filter subscriptions by customer or restaurant name',
  
  })
  @IsOptional()
  @IsString()
  search?: string;
}




export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Subscription order ID',
    example: '695279ac6b2e1eaa89975425',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'New status of the subscription order',
    enum: OrderSubscripitionStatus,
    example: OrderSubscripitionStatus.Delivered,
  })
  @IsEnum(OrderSubscripitionStatus, {
    message: 'Status must be a valid OrderSubscripitionStatus',
  })
  status: OrderSubscripitionStatus;
}





export class listOrderSubscriptionDto {

  @ApiPropertyOptional({
    description: 'Filter subscription by status',
    enum: OrderSubscripitionStatus,
    example: OrderSubscripitionStatus.Upcomming,
  })
  @IsOptional()
  @IsEnum(OrderSubscripitionStatus, {
    message: 'Status must be pending, placed, delivered , cancelled or upcomming',
  })
  status?: OrderSubscripitionStatus;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Limit number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Customer ID or Restaurant ID (Admin only)',
    example: '69242dbf06bd48bafa7223b1',
  })
  @IsOptional()
  @IsString({
    message: 'id must be a valid MongoDB ObjectId',
  })
  id?: string;


  @ApiPropertyOptional({
    description: 'Search term to filter subscriptions by customer or restaurant name',

  })
  @IsOptional()
  @IsString()
  search?: string;
}




export class CustomerCreateSubscriptionDto {

  @ApiProperty({ example: '690d7a12f784f20f28840c25' })
  restaurant_id: string;


  @ApiProperty({ example: '694d2534dff8e729e2a8c747' })
  subscription_item_id: string;

  @ApiProperty({ enum: MealType, example: MealType.NonVeg })
  meal_type: MealType;

  @ApiProperty({ example: '2024-01-01T00:30:00.000Z' })
  meal_time: string;


  @ApiProperty({ enum: PlanDuration, example: PlanDuration.Weekdays })
  plan_duration: PlanDuration;


  @ApiProperty({ example: 'No onion, medium spice' })
  custom_note: string;

  @ApiProperty({
    description: 'Selected days for subscription',
    type: [String],
    required: false,
    example: ['Mon', 'Wed', 'Fri'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selected_days?: string[];


  @ApiProperty({
    type: DeliveryAddress,
    description: 'Delivery address for subscription',
    example: {
      name: '531, Sector 20A',
      lat: '30.72765964702996',
      long: '76.78958918799881',
      building_no: '531',
      tower: '',
      area: 'Sector 20',
      city: 'Chandigarh',
      nearby_landmark: '',
      type: 'home',
    },
  })
  @ValidateNested()
  @Type(() => DeliveryAddress)
  delivery_address: DeliveryAddress;
}








export class AddItemDto {

  @ApiProperty({
    example: 'Chicken Biryani',
    description: 'Title of the item',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Hyderabadi dum biryani with raita',
    description: 'Item description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 249,
    description: 'Price of the item',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'https://example.com/item-image.jpg',
    description: 'Item image URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  image?: string;
}

export class UpdateItemDto extends PartialType(AddItemDto) {
}

export class ItemListDto {

  @ApiProperty({
    example: 1,
    description: 'Page no',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;


  @ApiProperty({
    example: 20,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({ example: "690446a7ae2e92cb3dd628e5" })
  restaurant_id: string



}

export class ItemStatusDto {
  @ApiProperty({ type: String, enum: SubscriptionItemStatus, default: SubscriptionItemStatus.Active })
  @IsEnum(SubscriptionItemStatus)
  status: SubscriptionItemStatus;
}