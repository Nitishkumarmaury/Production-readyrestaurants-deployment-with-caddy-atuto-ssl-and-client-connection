import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';

export class CreateResturantBannerDto {
    
    @IsString()
    @ApiPropertyOptional({
        description: 'ID of the restaurant this banner belongs to',
        example: '64c999b183ed8e0012c66a31',
        required: true,
    })
    restaurant_id: string;

    @IsString()
    @ApiProperty({
        description: 'URL of the banner image',
        example: 'https://cdn.example.com/banners/banner1.jpg',
        required: true,
    })
    banner_url: string;

    @IsString()
    @ApiProperty({
        description: 'Title of the banner',
        example: 'Special Discount on Weekends!',
        required: true,
    })
    title: string;

    @IsString()
    @ApiProperty({
        description: 'Short description of the banner',
        example: 'Enjoy up to 30% off on selected dishes every weekend.',
        required: true,
    })
    description: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Start date from when the banner should be shown',
        example: '2025-08-05T00:00:00.000Z',
        required: false,
    })
    start_date?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'End date after which the banner should be hidden',
        example: '2025-08-10T23:59:59.000Z',
        required: false,
    })
    end_date?: Date;

}






