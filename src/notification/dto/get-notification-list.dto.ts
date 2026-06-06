import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum SortByValues {
  CreatedAt = 'createdAt',
  IsRead = 'isRead',
}

export enum SortOrder {
  Ascending = 1,
  Descending = -1,
}

export class GetNotificationListDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public pageNumber?: number;

  // @ApiPropertyOptional({
  //   example: 'unread',
  //   description: 'Filter by read status ("read" or "unread")',
  // })
  // @IsOptional()
  // @IsString()
  // public filterByReadStatus?: string;

  // @ApiPropertyOptional({
  //   description: 'Sort by field',
  //   example: SortByValues.CreatedAt,
  //   enum: SortByValues,
  // })
  // @IsOptional()
  // @IsEnum(SortByValues)
  // public sortBy?: SortByValues;

  // @ApiPropertyOptional({
  //   description: 'Sort order (1 for ascending, -1 for descending)',
  //   example: SortOrder.Descending,
  //   enum: SortOrder,
  // })
  // @IsOptional()
  // @IsEnum(SortOrder)
  // public sortOrder?: SortOrder;

  @ApiPropertyOptional({
    example: 12,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public count?: number;
}
