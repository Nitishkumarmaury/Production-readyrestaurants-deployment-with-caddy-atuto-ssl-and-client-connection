import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class StaffListDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description: 'Search staff by name',
        example: 'John',
    })
    name?: string;

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
