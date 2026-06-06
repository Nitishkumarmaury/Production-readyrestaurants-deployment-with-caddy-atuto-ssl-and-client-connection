import { ApiProperty } from "@nestjs/swagger";
class RateFood {
    @ApiProperty()
    food_id: string;

    @ApiProperty()
    rate: string;
}

export class RateRestaurantDto{

    @ApiProperty({})
    order_id:string

    @ApiProperty({})
    restaurant_id:string

    @ApiProperty({ type: [RateFood] })
    food_items: RateFood[];

    @ApiProperty({})
    rating:string

    @ApiProperty({})
    description:string

    @ApiProperty({})
    image:string
}

export class RateDriverDto{

    @ApiProperty({})
    order_id:string

    @ApiProperty({})
    driver_id:string

    @ApiProperty({})
    rating:string

    @ApiProperty({})
    description:string

    @ApiProperty({})
    image:string
}

export class RateCustomerDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  customer_id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  description?: string;
}
