import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { RestaurantType } from "../schema/vendor.schema";
import { OrderStatus } from "src/order/schema/order.schema";
import { OrderType } from "src/order/dto/order.dto";

export class TodayOrdersDto {
    @ApiProperty({})
    restaurant_id: string

    @ApiProperty({ enum: OrderStatus, })
    status: string

    @ApiProperty({})
    page: string

    @ApiProperty({})
    limit: string

    @ApiPropertyOptional({ enum: OrderType })
    order_type: string

}

export class OrdersDto {
    @ApiProperty({})
    restaurant_id: string

    @ApiProperty({ enum: ['today', 'week', 'month'] })
    status: string

    @ApiProperty({})
    page: number

    @ApiProperty({})
    limit: number

}

export class UpdateOrderDto {
    @ApiProperty({})
    order_id: string

    @ApiProperty({ enum: ['accept', 'decline', 'ready', 'picked_up', 'start_preparing'], })
    status: string

    @ApiProperty({})
    otp: string
    
}

export class AddMorePreparingTimeDto {
    @ApiProperty({})
    order_id: string

    @ApiProperty({})
    time: number


}
export class saveIndexDragDropDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IndexItemDto)
    items: IndexItemDto[];
}
export class IndexItemDto {
    @ApiProperty({})
    id: string

    @ApiProperty({})
    category_id: string

    @ApiProperty({})
    sort_index: number
}




