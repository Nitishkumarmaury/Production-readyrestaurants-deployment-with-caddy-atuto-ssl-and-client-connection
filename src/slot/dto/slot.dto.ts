import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, IsDate, IsNumber, Min } from 'class-validator';
import { CustomerBookingStatus } from '../schema/customer-slot.schema';

export class slotListDto {

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'slot date',
        example: '2025-10-24T02:00:00.000+00:00',
        required: false,
    })
    date?: Date;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
    })
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
    })
    limit?: number = 10;


}


export class slotBookingDto {
    @ApiProperty({ example: "68d4d05ecf7bb94427290ef9" })
    slot_id: string

    @ApiProperty({ example: "" })
    special_request: string

    @ApiProperty({ example: "" })
    occasion_type: string

    @ApiProperty({ example: "" })
    no_of_guest: number


}





export class BookingListDto {


    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
    })
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
    })
    limit?: number = 10;

    @ApiPropertyOptional({
        type: String, enum: CustomerBookingStatus
    })
    status?: CustomerBookingStatus;


    @ApiPropertyOptional({
        type: String, description: "user customer_id or restaurant id  for filter "
    })
    id?: String;

    @ApiPropertyOptional({
        type: String, description: "search by customer name"
    })
    @IsOptional()
    @IsString()
    search?: string;

}



export class BookingStatusDto {

    @ApiProperty({ example: "" })
    id: string

    @ApiProperty({ type: String, enum: CustomerBookingStatus, description: `${CustomerBookingStatus.Cancel} & ${CustomerBookingStatus.MarkAsArrived}` })
    status: CustomerBookingStatus

}
