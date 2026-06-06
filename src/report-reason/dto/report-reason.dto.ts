import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
    Customer_Restaurant = "customer_restaurant",
    Customer_Order = "customer_order",
    Vendor = 'vendor',
    AccountDelete = "account_delete"
}

/**
 * Data Transfer Object for creating a new report.
 * This class uses decorators for validation and Swagger documentation.
 */
export class ReportDto {

  @ApiProperty({
    description: 'The type of entity the report is for (customer, driver, or vendor)',
    example: ReportType.Customer_Order,
    enum: ReportType,
  })
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @ApiProperty({
    description: 'The reason for the report',
    example: 'Abusive language from driver',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}



export class ReportListDto {
  

    @ApiProperty({
    description: 'The type of entity the report is for (customer, driver, or vendor)',
    example: ReportType.Customer_Order,
    enum: ReportType,
    })
    @IsEnum(ReportType)
    @IsNotEmpty()
    type: ReportType;


    @ApiProperty({example : 1})
    page: number;

    @ApiProperty({example : 20})
    limit: number;
}