import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";


export enum Currency {
    INR = 'INR',
    USD = 'USD',
}


export class AdminDto {

}
export enum notification_to {
  Customers = 'customer',
  Drivers = 'driver',
  Restaurants = 'restaurant',
  Restaurant = 'restaurant',
  selected_restaurant = 'selected_restaurant',
  selected_customer = 'selected_customer',
  selected_driver = 'selected_driver',
}

export enum notificationType {

  Immediately = "immediately",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  CustomDate = "custom-date"

}



export enum notification_via {
  email = 'email',
  push = 'push',
}

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}


export class SignInDto {
  @ApiProperty({ example: "admin@gmail.com" })
  email: string;

  @ApiProperty({ example: "Admin@#123" })
  password: string;
}


export class UpdateTaxAmount {
  @ApiProperty()
  amount: number


}




export class NotificationDto {


  @ApiProperty({ type: String, enum: notification_to })
  send_notification_to: string;

  @ApiProperty({ type: [String] }) // Use an array to represent multiple emails
  selected_ids: string[];

  @ApiProperty({ type: String, enum: notification_via })
  send_notification_via: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ type: String, enum: notificationType })
  type: string;

  @ApiPropertyOptional({
      description: 'custom date',
      example: '2025-10-09T02:00:00.000+00:00',
      required: false,
  })
  @IsDate()
  @Type(() => Date)
  custom_date?: Date;

  @ApiPropertyOptional({ example: [1,2,3,4,5]})
  monthly: [Number]
  
  @ApiPropertyOptional({ example : ["Monday" , "Tuesday"]})
  weekly: [String]
  


}


export class pick_restro {

  @ApiProperty({ default: "" })
  @IsArray()
  restaurant_ids: string[];

}

export class pick_restro_list {

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}



export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'OldPass@123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password to be set',
    example: 'NewPass@456',
  })
  @IsString()
  newPassword: string;
}


export class UpdateOwnerDto {
  @IsOptional()
  @ApiProperty({
    required: false,
    example: '6927944e3848125216478c3e',
    description: 'Owner ID'
  })
  ownerId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    required: false,
    example: '6891c4cd960d158a977385ee',
    description: 'Product ID to which the owner is being added(If not provided in header)'
  })
  productId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  full_name: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  @ApiProperty({default : "test123@yopmail.com"})
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({default : "test123"})
  password: string;

  
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, default: 'image.png' })
  profile_pic?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, default: '+91' })
  country_code?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, default: '9801000000' })
  phone_number?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  location: string;

  
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Billing date in number',
    example: 1,
    type: Number,
  })
  billing_date?: number;

  @IsEnum(Currency)
  @IsNotEmpty()
  @ApiProperty({ enum: Currency, description: 'Billing currency (USD or INR)' })
  currency: Currency;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Subdomain slug' })
  subdomain_slug: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Database url' })
  databaseUrl: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Database name' })
  database: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ description: 'Is customer apps available' })
  is_customer_app_available: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ description: 'Is driver apps available' })
  is_driver_app_available: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ description: 'Is apps available' })
  payment_gateway: boolean;



  @IsOptional()
  @ApiPropertyOptional({ description: 'Available modules', example :  [ 'GROCERY', 'ELECTRONICS', 'PHARMACY', 'CLOTHING', 'FOOD' ] })
  available_modules: string[];


}




export class CloudNotificationListDto {


  @ApiProperty({example : 1})
  page: number;

  @ApiProperty({example : 20})
  limit: number;


}


export class TopUsersDto {

  @ApiProperty({ enum: ["driver", "restaurant", "customer"] })
  type: string;



}