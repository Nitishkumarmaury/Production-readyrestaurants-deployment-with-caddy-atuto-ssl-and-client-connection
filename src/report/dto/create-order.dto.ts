import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
    @ApiProperty()
    order_id: string

    @ApiProperty()
    description: string

    @ApiProperty()
    image: string

    @ApiProperty()
    report_reason_id: string

}

export class findAllDto {

    @ApiProperty({
        default: 'pending',
        enum: ['pending', 'replied']
    })
    status: 'pending' | 'replied' = 'replied';
    @ApiProperty()
    page: string
    @ApiProperty()
    limit: string
}