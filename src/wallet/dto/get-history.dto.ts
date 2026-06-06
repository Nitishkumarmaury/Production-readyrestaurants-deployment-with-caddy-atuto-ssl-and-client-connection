import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { DebitType } from '../entities/wallet-transaction.entity';

export enum DateRangeType {
  CURRENT_MONTH = 'CURRENT_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  CUSTOM = 'CUSTOM',
}

export class TransactionPaginationDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @ApiPropertyOptional({
    required: false,
    example: DebitType.WITHDRAWAL,
    description: 'debit_type filter',
  })
  public debit_type: string;
}