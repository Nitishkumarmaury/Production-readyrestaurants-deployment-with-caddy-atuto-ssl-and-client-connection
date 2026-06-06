import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class PaginationGetPointDto {
    @IsOptional()
    @IsNumberString()
    @ApiPropertyOptional({
        description: 'Page number',
        example: '1',
    })
    page?: string;

    @IsOptional()
    @IsNumberString()
    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: '10',
    })
    limit?: string;
}
