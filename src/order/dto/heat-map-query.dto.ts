import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class HeatMapQueryDto {
    @IsOptional()
    @IsIn(['weekly', 'monthly', 'quarterly', 'halfyearly', 'all'])
    @ApiProperty({
        description: 'Time range for the heat map data',
        enum: ['weekly', 'monthly', 'quarterly', 'halfyearly', 'all'],
        default: 'all',
    })
    range?: 'weekly' | 'monthly' | 'quarterly' | 'halfyearly' | 'all' = 'all';

    @IsOptional()
    @ApiProperty({
        description: 'Page number for paginated results',
        default: '1',
    })
    page?: string

    @IsOptional()
    @ApiProperty({
        description: 'Number of results per page',
        default: '10',
    })
    limit?: string;
}
