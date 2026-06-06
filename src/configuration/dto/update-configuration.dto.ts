import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateConfigurationDto } from './create-configuration.dto';
import { IsArray, isEnum, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionForRestaurantBy, DeliveryFeeOptions } from '../schema/app-configuration.schema';
import { Working } from 'src/restaurant/dto/restaurant.dto';

export enum PaymentGateway {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',

  WALLET = 'wallet',
}

export enum ConfiguratonType {
  Payment = 'payment',
  UiSettings = 'ui-settings',
  ThirdPartyCredentials = "third-party-credentials",
}


export class RazorpayDto {

  @ApiProperty({ type: 'string', example: 'RAZORPAY_KEY_ID' })
  key: string;

  @ApiProperty({ type: 'string', example: 'RAZORPAY_KEY_SECRET' })
  secret: string;

  @ApiProperty({ type: 'string', example: '2323230044459325' })
  bank_account: string;

}

export class BucketDto {
  
  @ApiProperty({ type: 'string', example: 'demoserver3' })
  bucket_name: string;
  
  @ApiProperty({ type: 'string', example: 'DO_ACCESS_KEY' })
  do_access_key: string;
  
  @ApiProperty({ type: 'string', example: 'DO_SECRET_ACCESS_KEY' })
  do_secret_access_key: string;
  
  @ApiProperty({ type: 'string', example: 'sgp1:Singapore' })
  do_region: string;

  @ApiProperty({ type: 'string', example: 'https://demoserver3.sgp1.digitaloceanspaces.com' })
  do_endpoint: string;

  @ApiProperty({ type: 'string', example: 'dev' })
  folder: string;
  

}



export class StripeDto {

  @ApiProperty({ type: 'string', example: 'STRIPE_PUBLIC_KEY' })
  key: string;

  @ApiProperty({ type: 'string', example: 'STRIPE_SECRET_KEY' })
  secret: string;

  @ApiProperty({ type: 'string', example: 'STRIPE_WEBHOOK_SECRET' })
  webhook: string;
}


export class GeoPointDto {
  @ApiProperty({ example: 'Point', enum: ['Point'] })
  @IsString()
  type: 'Point';

  @ApiProperty({ example: [77.5946, 12.9716], description: '[longitude, latitude]' })
  @IsNumber({}, { each: true })
  coordinates: number[];
}

class ServiceAreaDto {
  @ApiProperty({ type: 'number', example: 12.9716 })
  lat: number;

  @ApiProperty({ type: 'number', example: 77.5946 })
  lng: number;

  @ApiProperty({ type: 'string', example: 'Bangalore, India' })
  location_name: string;

  @ApiProperty({ type: 'number', example: 5000 }) // in meters
  admin_service_range: number;

  @ApiProperty({ type: Boolean, example: false })
  is_all_world: boolean;
}


class SmtpCreds {

  @ApiProperty({ type: 'string', example: 'api.zeptomail.com/' })
  mail_url: string;

  @ApiProperty({ type: 'string', example: 'noreply@henceforthsolutions.com' })
  mail_from_email: string;

  @ApiProperty({ type: 'string', example: 'ReadyDelivery' })
  mail_from_name: string;

  @ApiProperty({ type: 'string', example: 'SMTP_API_KEY' })
  mail_key: string;

}


export class CustomerEditProfileDto {
  @ApiProperty({ type: Boolean, example: false })
  anniversary_date: boolean;

  @ApiProperty({ type: Boolean, example: false })
  gender: boolean;

  @ApiProperty({ type: Boolean, example: false })
  dob: boolean;
}


export class AppLinks {

  @ApiProperty({ type: 'string', example: '' })
  customer_play_store_link: string;


  @ApiProperty({ type: 'string', example: '' })
  mail_from_name: string;


  @ApiProperty({ type: 'string', example: '' })
  customer_app_store_link: string;


  @ApiProperty({ type: 'string', example: '' })
  vendor_app_store_link: string;

}


export class FirebaseKeys {
 
  @ApiProperty({ type: Object })
  frontend_key: object;

  @ApiProperty({ type: 'string', example: 'FIREBASE_VAPID_KEY' })
  vapid_Key: string;

  @ApiProperty({ type: Object })
  backend_key: object;

  @ApiProperty({ type: Object })
  mobile_key: object;



}



export class UpdateConfigurationDto {
  @ApiProperty()
  product_name: String;

  @ApiProperty({
    type: Object,
    properties: {
      email: { type: 'string' },
      call: { type: 'string' },
      skype: { type: 'string' },
    },
    required: false,
  })
  support: { email: string; call: string; skype: string };


  @ApiProperty({
    type: Object,
    properties: {
      tax_keyword: { type: 'string' },
      tax_keyword_hindi: { type: 'string' },
      tax_percentage: { type: 'string' },
    },
    required: false,
  })
  tax: { tax_keyword: string; tax_percentage: string; tax_keyword_hindi: string };



  @ApiProperty({
    type: Object,
    properties: {
      AppEmail: { type: 'string' },
      AppPassword: { type: 'string' },
    },
    required: false,
  })
  email_creds: { AppEmail: string; AppPassword: string };

  @ApiProperty({
    type: Object,
    properties: {
      cloth_charge: { type: 'string' },
      bag_charge: { type: 'string' },
    },
    required: false,
  })
  driver_charges: { cloth_charge: string; bag_charge: string };


  @ApiProperty({
    type: Object,
    properties: {
      facebook_url: { type: 'string' },
      instagram_url: { type: 'string' },
      youtube_url: { type: 'string' },
    },
    required: false,
  })
  social_links: {
    facebook_url: string;
    instagram_url: string;
    youtube_url: string;
  };

  @ApiProperty({
    type: ServiceAreaDto,
    required: false,
  })
  service_area: ServiceAreaDto;

  @ApiProperty()
  base_fee: number

  @ApiProperty()
  distance_per_km: number

  @ApiProperty()
  commission_percentage_for_driver: number

  @ApiProperty({enum : CommissionForRestaurantBy, example : CommissionForRestaurantBy.Percentage})
  commission_for_restaurant_by: CommissionForRestaurantBy;

  @ApiProperty()
  commission_percentage_for_restaurant: number

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  order_taking_range?: number;


  @ApiProperty()
  show_restaurant_range: number

  @ApiProperty()
  app_commission: number

  @ApiProperty({ type: Boolean, example: true })
  wallet: boolean;

  @ApiProperty({ type: Boolean, example: true })
  loyalty: boolean;

  @ApiProperty()
  loyalty_minimun_order: number


  @ApiProperty()
  amount_per_loyalty: number

  

  @ApiProperty({
    description: 'List of cities',
    example: ['dubai', 'singapore', 'sydney'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  cities: string[];

  @ApiProperty({
    type: Object,
    properties: {
      number_of_persons: { type: 'number' },
      number_of_orders: { type: 'number' },
      amount: { type: 'number' },


    },
    required: false,
  })
  referral: { referral_person: number; referral_order: number; referral_amount: number };


  @ApiProperty({
    description: 'The payment gateway to use.',
    enum: PaymentGateway,
    example: PaymentGateway.STRIPE,
  })
  @IsEnum(PaymentGateway)
  readonly paymentGateway: PaymentGateway;


  @ApiProperty({
    type: StripeDto,
    required: false,
  })
  stripe: StripeDto;


  @ApiProperty({
    type: RazorpayDto,
    required: false,
  })
  razorpay: RazorpayDto;




  @ApiProperty({ type: CustomerEditProfileDto, required: false })
  customer_edit_profile: CustomerEditProfileDto;

  @ApiProperty({example : 5})
  catering_commission: number



  @ApiProperty({
    description: 'Delivery Fee Options.',
    enum: DeliveryFeeOptions,
    example: DeliveryFeeOptions.Admin,
  })
  @IsEnum(DeliveryFeeOptions)
  deliveryFeeOptions: DeliveryFeeOptions;


  @ApiPropertyOptional({type : Object})
  ui_settings: object;

  @ApiPropertyOptional({example : 'GOOGLE_MAPS_API_KEY'})
  google_map_key_backend: string;

  @ApiPropertyOptional({example : 'GOOGLE_MAPS_API_KEY'})
  google_map_key_mobile: string;

  @ApiPropertyOptional({example : 'GOOGLE_MAPS_API_KEY'})
  google_map_key: string;


  @ApiPropertyOptional({ type: BucketDto, required: false })
  bucket: BucketDto;

  @ApiPropertyOptional({ type: SmtpCreds, required: false })
  smtp_creds: SmtpCreds;


  @ApiPropertyOptional({type : FirebaseKeys})
  firebase_keys: FirebaseKeys;



  @ApiPropertyOptional({type : AppLinks})
  app_links: AppLinks;


  @ApiProperty()
  is_fixed_time_delivery: boolean

  @ApiProperty({ type: [Working] })
  fixed_time_delivery: Working[];

  @ApiPropertyOptional({ type: Boolean, example: false })
  isFreeDeliveryAvailable: boolean;

  @ApiPropertyOptional({ type: Number, example: 200 })
  freeDeliveryMinOrderAmount: number;


}



export class UpdateConfigurationDtoPartial extends PartialType(UpdateConfigurationDto) { }


export class ConfiguratonDto {


  @ApiPropertyOptional({
    type : String,
    description: 'for file keys.',
    enum: ConfiguratonType,
  })
  @IsEnum(ConfiguratonType)
  type: ConfiguratonType;

}
