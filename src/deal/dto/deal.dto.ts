import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { DealStatus } from '../schema/deal.schema';
import { DeliveryAddress } from 'src/order/dto/order.dto';
import { DealBuyStatus } from '../schema/deal-buy.schema';

class ItemDto {
  @ApiProperty({ example: "673d8c928c9e87af2b8b2b23" })
  @IsString()
  @IsNotEmpty()
  food_id: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;
}

export class CreateDealDto {
  @ApiProperty({ example: "Combo Meal" })
  @IsString()
  title: string;

  @ApiProperty({ example: 199 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: "https://example.com/image.jpg" })
  @IsString()
  image: string;

  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}



export class UpdateDealDto extends PartialType(CreateDealDto) {}


export class DealListDto {
  
  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;


  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({})
  search :string


  @ApiPropertyOptional({example : "690446a7ae2e92cb3dd628e5"})
  restaurant_id :string

}

export class allDealListDto {

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;


  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({})
  search: string
}


export class allDealListCustomerDto {

  @ApiProperty({ example: "69706871f95a81e8add617a7"})
  @IsString()
  customer_id: string

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;


  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({})
  search: string
}



export class allDealListRestaurantealsDto {

  @ApiProperty({ example: "690d7a12f784f20f28840c25" })
  @IsString()
  restaurant_id: string

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;


  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({})
  search: string
}


export class DealStatusDto {

    
    @ApiProperty({type : String,  enum : DealStatus, default : DealStatus.Active })
    @IsEnum(DealStatus)
    status: DealStatus;
}




export class BuyDealDto {

  @ApiProperty({example : "690496ae35478eb15cdf414e"})
  restaurant_id :string

  @ApiProperty({example : "690496ae35478eb15cdf414e"})
  deal_id :string

  @ApiProperty()
  notes :string
  
  @ApiProperty({ type: DeliveryAddress })
  delivery_address: DeliveryAddress;
  
  @ApiProperty({example : "2025-10-31T00:00:00.000Z"})
  scheduled_time: Date; // ISO format
  
}


export class DealOrderStatusDto {

  @ApiProperty({example : "690496ae35478eb15cdf414e"})
  deal_order_id :string;


  @ApiProperty({ type: String , enum :  DealBuyStatus})
  status: DealBuyStatus;

}





export class orderListDto {
  
  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;


  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;

}
