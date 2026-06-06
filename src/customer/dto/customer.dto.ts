import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { OrderType } from "src/order/dto/order.dto";
import { OrderStatus } from "src/order/schema/order.schema";
import { RestaurantType } from "src/vendor/schema/vendor.schema";

export class CustomerAddressDto {
    @ApiProperty()
    name: string;
  
    @ApiProperty()
    lat: string;
  
    @ApiProperty()
    long: string;
  
    @ApiProperty({ default: 'home'})
    type: string
  }

  export class UpdateAddressDto {
    @ApiProperty()
    name: string;
  
    @ApiProperty()
    lat: string;
  
    @ApiProperty()
    long: string;
  
   
  }

  export class GetAllRestaurantDto{

    @ApiProperty()
    lat:string

    @ApiProperty()
    long:string


    @ApiProperty()
    sort_by:string

    @ApiProperty()
    rating_4plus:boolean

    @ApiProperty()
    veg:boolean

    @ApiProperty()
    non_veg:boolean

    @ApiProperty()
    egg:boolean

    @ApiProperty()
    jain:boolean
  
    @ApiProperty()
    isDineOut:boolean

    
    @ApiProperty()
    isFoodDelivery:boolean

    
    @ApiProperty()
    catering_services:boolean

    @ApiPropertyOptional()
    dealProvider:boolean


    @ApiPropertyOptional()
    isSubscriptionProvide:boolean


  }

  export class QuickPicksDto{

    @ApiProperty({required:false})
    lat:string

    @ApiProperty({required:false})
    long:string


    @ApiProperty()
    limit:number

    @ApiProperty()
    page:number

    


  }


export class groceryRestaurentDto{
  @ApiProperty({ required: false })
  lat: string

  @ApiProperty({ required: false })
  long: string

  @ApiPropertyOptional({ 
    default: RestaurantType.Grocery, 
    enum: RestaurantType 
  })
  type: RestaurantType.Grocery ;


  }

  export class CustomerListDto {

    // @ApiProperty({ 
    //   default: 'active', 
    //   enum: ['active', 'block','deleted'] 
    // })
    // status: 'active' | 'block' | 'deleted'='deleted';
  
  
    @ApiPropertyOptional()
    search?: string;
  
    @ApiProperty()
    page: number;
  
    @ApiProperty()
    limit: number;
  }


  export class AdminCustomerDto {

    @ApiProperty({ 
      default: 'active', 
      enum: ['active', 'block','deleted', "pending"] 
    })
    status: 'active' | 'block' | 'pending' |'deleted'='deleted';
  
  
    @ApiPropertyOptional()
    search?: string;
  
    @ApiProperty()
    page: number;
  
    @ApiProperty()
    limit: number;
  }

  export class CustomerBlockDto{
   
   @ApiProperty()
   customer_id:string
   
    @ApiProperty({ 
      default: 'block', 
      enum: ['block','unblock'] 
    })
    status:  'block' | 'unblock'='unblock';
  
    @ApiPropertyOptional()
    reason:string
  }

  export class CustomerOrderDto{
    @ApiProperty()
    customer_id:string

    @ApiProperty()
    page:number

    @ApiProperty()
    limit:number
  }

  export class relevantSearchDto{
    @ApiProperty({required:true})
    search:string

    @ApiProperty({required:false})
    lat:string

    @ApiProperty({required:false})
    long:string
  }

  export class DetailedSearchDto{
    @ApiProperty()
    search:string

    @ApiProperty()
    type:string

    @ApiProperty({required:false})
    lat:string

    @ApiProperty({required:false})
    long:string

    @ApiPropertyOptional()
    sort_by:string

    @ApiPropertyOptional()
    rating_4plus:boolean

    @ApiPropertyOptional()
    veg:boolean

    @ApiPropertyOptional()
    non_veg:boolean

    
    @ApiPropertyOptional()
    isDineOut:boolean

  }

  export class CustomerWalletHistoryDto {
  @ApiProperty({
    description: 'The page number to retrieve, starting from 1.',
    example: 1,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'The number of items per page. Defaults to 20 if not specified.',
    example: 20,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}



export class featuresListDto{

    @ApiProperty({required:false})
    lat:string

    @ApiProperty({required:false})
    long:string
  
    @ApiProperty({required:false})
    response_type:string

    @ApiProperty()
    isDineOut:boolean


}
  



export class YourOrdersDto {
  @ApiProperty()
  limit:string

  @ApiProperty()
  page:string

  @ApiPropertyOptional({type : String, enum :OrderStatus} )
  order_status: OrderStatus
  
  @ApiPropertyOptional({type:String,enum :OrderType})
  order_type:OrderType

}