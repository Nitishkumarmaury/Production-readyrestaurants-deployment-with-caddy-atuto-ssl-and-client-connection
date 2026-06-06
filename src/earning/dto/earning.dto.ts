import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RestaurantEarningsDto{
    @ApiProperty()
    restaurant_id:string
    
    @ApiProperty({ enum: ['today', 'week', 'month'],})
    status:string

    @ApiProperty()
    page:number

    @ApiProperty()
    limit:number
}

export class DriverEarningsDto{
    
    @ApiProperty({ enum: ['weekly', 'total'],})
    status:string

    @ApiPropertyOptional()
    page:number

    @ApiPropertyOptional()
    limit:number
}

export class AdminEarningsDto{
    
    @ApiProperty({ enum: ['today', 'week','month','year','custom'],})
    status:string

    @ApiProperty({ enum: ['order', 'driver-order']})
    type:string

    @ApiPropertyOptional({})
    start_date:number

    @ApiPropertyOptional({})
    end_date:number

    @ApiPropertyOptional()
    page:number

    @ApiPropertyOptional()
    limit:number
}
export class ExportEarningDto{

    @ApiPropertyOptional()
    start_date:number
    
    @ApiPropertyOptional()
    end_date:number
   
   }