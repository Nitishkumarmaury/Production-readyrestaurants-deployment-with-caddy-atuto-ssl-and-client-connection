import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested } from "class-validator";

class VariantsKeys {
  @ApiProperty()
  title: string;

  @ApiProperty()
  add_price: number;

  @ApiProperty()
  final_price: number;
}



class CustomizationKeys {
  @ApiProperty()
  title: string;

  @ApiProperty()
  customer_selection: string;

  @ApiProperty()
  additional_price: number;
}

class MakeYourOwn {

  @ApiProperty()
  group_id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  customer_selection: string;

  @ApiProperty()
  additional_price: number;
}


export class makeYouOwnGroup {
  @ApiProperty()
  group_title: string

  @ApiProperty()
  group_description: number
}
class Slots {
  @ApiProperty()
  start_time: string;

  @ApiProperty()
  end_time: string;
}
class ItemTiming {
  @ApiProperty()
  day: string;

  @ApiProperty()
  day_id: string;

  @ApiProperty()
  start_time: string;

  @ApiProperty()
  end_time: string;


}


export class AddFoodDto {
  @ApiProperty()
  category_id: string

  @ApiProperty()
  image: string[]

  @ApiProperty()
  name: string

  @ApiProperty()
  price: number

  @ApiProperty()
  food_type: string

  @ApiProperty({ type: [CustomizationKeys] })
  add_ons: CustomizationKeys[];

  @ApiProperty({ type: [CustomizationKeys] })
  toppings: CustomizationKeys[];

  @ApiProperty({ type: [MakeYourOwn] })
  make_your_own: MakeYourOwn[];

  @ApiProperty({ type: [VariantsKeys] })
  pieces: VariantsKeys[];

  @ApiProperty({ type: [VariantsKeys] })
  size: VariantsKeys[];

  @ApiProperty({ type: [VariantsKeys] })
  quantity: VariantsKeys[];

  @ApiProperty({ type: [ItemTiming] })
  item_timing: ItemTiming[];

  @ApiProperty()
  description: string

  @ApiProperty()
  extimate_time: number

  @ApiProperty()
  availability_type: string

  @ApiProperty({ required: false, default: false })
  is_recommend: boolean
  

}

export class BulkAddFoodItemDto {
  @ApiProperty()
  category_id: string;

  @ApiProperty({ type: String, required: true })
  image: string;

  @ApiProperty({ type: String, required: true })
  name: string;

  @ApiProperty({ type: String, required: true })
  price: number;

  @ApiProperty()
  food_type: string;

  @ApiProperty()
  description: string;
}

export class BulkAddFoodDto {
  @ApiProperty({ type: [BulkAddFoodItemDto] })
  items: BulkAddFoodItemDto[];
}

export class UpdateFoodDto {
  @ApiProperty()
  category_id: string

  @ApiProperty()
  image: string[]

  @ApiProperty()
  name: string

  @ApiProperty()
  price: number

  @ApiProperty()
  food_type: string

  @ApiProperty()
  description: string

  @ApiProperty()
  extimate_time: number

  @ApiProperty({ type: [ItemTiming] })
  item_timing: ItemTiming[];

  @ApiProperty({ required: false, default: false })
  is_recommend: boolean


}


export class isAvailableDto {
  @ApiProperty({ enum: ['true', 'false'], })
  status: string

}

export class FindFoodDto {
  
  @ApiPropertyOptional()
  restaurant_id: string

  @ApiPropertyOptional()
  category_id: string

  @ApiPropertyOptional()
  search: string

  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number


  @ApiPropertyOptional({ type: Boolean,default:true  })
  is_recommend: boolean


  @ApiPropertyOptional({ type: Boolean })
  catering_services: boolean

}

export class findMultipleFoodDto {
  @ApiProperty()
  food_id: string[]
}

export class mostOrderedFoodDto {
  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['weekly', 'monthly', 'yearly', 'custom'] })
  @IsOptional()
  range?: 'weekly' | 'monthly' | 'yearly' | 'custom';

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsOptional()
  end_date?: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiProperty({ enum: ['grocery', 'pharmacy', 'electronics', 'cloth', "food"], default: 'food' })
  @IsString()
  @IsOptional()
  type?: string

}

