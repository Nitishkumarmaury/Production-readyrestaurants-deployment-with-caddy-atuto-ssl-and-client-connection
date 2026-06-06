import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
// import { RestaurantVerificationStatus } from '../schema/restaurant.schema';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { MenuType, RestaurantVerificationStatus } from '../schema/restaurant.schema';
class restaurant_address {
  @ApiProperty()
  name: string;

  @ApiProperty()
  building_no: string;

  @ApiProperty()
  tower: string;

  @ApiProperty()
  area: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  nearby_landmark: string;

  @ApiProperty()
  lat: string;

  @ApiProperty()
  long: string;
}
export class Slots {
  @ApiPropertyOptional()
  @IsOptional()
  start_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  end_time: string;
}

export class Working {
  @ApiProperty()
  day: string;

  @ApiProperty()
  day_id: string;

  @ApiProperty()
  is_24_hrs: boolean;

  @ApiProperty({ type: [Slots] })
  timing: Slots[];
}


class Availability {
  @ApiProperty()
  table: string;

  @ApiProperty()
  seats: number;
}


export enum restaurantStatus {
  Online = 'online',
  offline = 'offline',
}
export class CreateRestaurantDto {



  @ApiProperty()
  restaurant_name: string;

  @ApiProperty()
  restaurant_phone: string;

  @ApiProperty()
  country_code: string;

  // @ApiProperty()
  // food_type: string[];

  // @ApiProperty()
  // average_preparing_time: number;

  @ApiProperty()
  owner_name: string;

  @ApiProperty()
  email: string;


  @ApiProperty({
    default: RestaurantType.Restaurant,
    enum: RestaurantType,
    description: 'Type of restaurant',

  })
  restaurant_type: RestaurantType;

}

export class UpdateRestaurantDto {


  @ApiPropertyOptional({
    default: RestaurantType.Restaurant,
    enum: RestaurantType,
    description: `restaurant-type : ${RestaurantType.HomeCookedMeal} , ${RestaurantType.Restaurant} &, ${RestaurantType.BothHomeRest}, ${RestaurantType.Grocery} `
  })
  restaurant_type: RestaurantType.Restaurant;

  @ApiProperty()
  restaurant_name: string;

  @ApiProperty()
  restaurant_phone: string;

  @ApiProperty()
  country_code: string;

  @ApiProperty()
  food_type: string[];

  @ApiProperty()
  average_preparing_time: number;

  @ApiProperty()
  owner_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  image: string;

  @ApiProperty({ type: restaurant_address })
  address: restaurant_address[];

  @ApiProperty({ type: [Working] })
  working_day: Working[];

  @ApiPropertyOptional({ type: [Working] })
  dine_out_working_day: Working[];

  @ApiProperty()
  food_licence_image: string;


  @ApiPropertyOptional()
  maximum_capacity_slot: number;

  @ApiPropertyOptional()
  buffer_time: number;

  @ApiPropertyOptional({ type: [Availability] })
  total_availability: Availability[];

  @ApiPropertyOptional()
  subscribers_limit: number;


  @ApiPropertyOptional({
    description: 'An array of services id',
    example: ['68d29047161507e9d2edcf3c', '68d29047161507e9d2edcf3d'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];


  @ApiPropertyOptional({
    description: 'An array of amenities id',
    example: ['68d2474fbaef822e9bf945b2', '68d247ec161507e9d2edcf2e'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'An array of URLs for the restaurant\'s photos',
    example: ['https://example.com/photos/photo1.jpg', 'https://example.com/photos/photo2.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  uploadRestaurantPhotos?: string[];

  @ApiPropertyOptional({
    description: 'An array of URLs for the restaurant\'s menu photos',
    example: ['https://example.com/photos/photo1.jpg', 'https://example.com/photos/photo2.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  uploadRestaurantMenu?: string[];


  @ApiPropertyOptional({
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isFoodDelivery: boolean;

  @ApiPropertyOptional({
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isDineOut: boolean;

  @ApiPropertyOptional({
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSubscriptionProvide: boolean;

  @ApiPropertyOptional({
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  dealProvider: boolean;


  @ApiPropertyOptional()
  estimated_price_per_plate: number;

  @ApiPropertyOptional()
  booking_amount: number;

  @ApiPropertyOptional({
    example: false,
  })
  is_delivery_available: boolean;

  @ApiPropertyOptional({ type: Number, example: 0 })
  delivery_price_per_km: number;

  @ApiPropertyOptional({ type: Number, example: 0 })
  delivery_range_in_km: number;


  @ApiPropertyOptional({
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  catering_services: boolean;


  @ApiPropertyOptional({
    example: false,
  })
  @IsNotEmpty()  // false - admin menu true - custom menu
  @IsBoolean()
  is_custom_menu: boolean;  

  


}

export class AddFoodDto {
  @ApiProperty()
  category_id: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  food_type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  extimate_time: string;
}

export class goOnlineDto {
  @ApiProperty()
  restaurant_id: string;

  @ApiProperty({ required: false, enum: restaurantStatus })
  status: string;
}

export class restaurantAdminListingDto {
  @ApiProperty({
    default: 'active',
    enum: ['active', 'block'],
  })
  status: 'active' | 'block' = 'block';

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiPropertyOptional({
    enum: RestaurantType,
  })
  restaurant_type?: RestaurantType;

}

export class restaurantAdminQuickListingDto {
  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class restaurantRequestListingDto {
  @ApiProperty({
    default: 'pending',
    enum: ['pending', 'reject'],
  })
  status: 'pending' | 'reject' = 'reject';

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class restaurantUpdateListingDto {

  @ApiProperty({
    default: 'pending',
    enum: ['pending', 'reject', 'rejected'],
  })
  status: 'pending' | 'reject' | 'rejected' = 'rejected';

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class UpdateRestaurantRequestDto {
  @ApiProperty()
  restaurant_id: string;

  @ApiProperty({
    default: 'accept',
    enum: ['accept', 'reject'],
  })
  status: 'accept' | 'reject' = 'reject';

  @ApiPropertyOptional()
  reason: string

  @ApiPropertyOptional({ default: false })
  is_update?: boolean;
}

export class RestaurantBlockDto {
  @ApiProperty()
  restaurant_id: string;

  @ApiProperty({
    default: 'block',
    enum: ['block', 'unblock'],
  })
  status: 'block' | 'unblock' = 'unblock';

  @ApiPropertyOptional()
  reason: string
}

export class RestaurantOrdersDto {
  @ApiProperty()
  restaurant_id: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class RestaurantEarningsDto {
  @ApiProperty()
  restaurant_id: string;

}

export class restaurant_request_list_dto {
  
  @ApiProperty({
    default: RestaurantVerificationStatus.SUBMITTED,
    enum: RestaurantVerificationStatus,
  })
  @IsEnum(RestaurantVerificationStatus)
  status: string;

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({
    default: 'requested',
    enum: ['requested', 'updated'],
  })
  @IsEnum(['requested', 'updated'])
  type: string;
}

export class AddDiscountDto {

  @ApiProperty({
    description: 'The discount percentage (0-100)',
    example: 15,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsInt()
  @Min(0, { message: 'Discount must be at least 0.' })
  @Max(100, { message: 'Discount cannot be more than 100.' })
  discount: number;

  @ApiProperty({
    description: 'The start time of the discount period as a Unix timestamp (in milliseconds).',
    example: 1672531200000,
  })
  @IsNumber()
  @IsNotEmpty()
  start_time: number;

  @ApiProperty({
    description: 'The end time of the discount period as a Unix timestamp (in milliseconds).',
    example: 1675123200000,
  })
  @IsNumber()
  @IsNotEmpty()
  end_time: number;

}

export enum DineOutSortBy {
  Rating = "Rating",
  Distance = "Distance"
}


export class dineOutListDto {

  @ApiPropertyOptional({ example: "" })
  search: string;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiPropertyOptional({ example: "veg" })
  food_type: string;


  @ApiPropertyOptional({ example: 4 })
  rating: number;


  @ApiPropertyOptional({ example: "68d29047161507e9d2edcf3e" })
  service_id: string;



  @ApiPropertyOptional({ type: DineOutSortBy, example: DineOutSortBy.Rating })
  sort_by: DineOutSortBy;

}




export class CreateRestaurantServiceDto {

  @ApiPropertyOptional({ example: "" })
  name: string;

  @ApiPropertyOptional({ example: "" })
  image: string;

}
export class UpdateRestaurantServiceDto extends PartialType(CreateRestaurantServiceDto) {
}




export class GetRestaurantServiceDto {

  @ApiPropertyOptional({ example: "" })
  search: string;

  @ApiPropertyOptional({ example: "1" })
  page: number;

  @ApiPropertyOptional({ example: "10" })
  limit: number;
}





export class QRCodeDto {

  @ApiPropertyOptional({ example: "", enum : ['restaurant', 'table'] })
  type: string;
}