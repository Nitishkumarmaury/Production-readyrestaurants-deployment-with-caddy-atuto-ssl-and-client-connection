import { ApiProperty } from "@nestjs/swagger";

export class CreateReportDto {
    @ApiProperty()
    restaurant_id: string

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
        enum: ['pending', 'resolved', 'replied']
    })
    status: 'pending' | 'resolved' | 'replied' = 'replied';
    @ApiProperty()
    page: string
    @ApiProperty()
    limit: string
}