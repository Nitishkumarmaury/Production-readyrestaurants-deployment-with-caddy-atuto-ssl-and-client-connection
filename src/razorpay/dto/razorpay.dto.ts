import { ApiProperty } from '@nestjs/swagger';

export class InvoiceDto {
  @ApiProperty({
    description: 'Invoice amount',
    example: 500,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency of the invoice',
    example: 'INR',
  })
  currency: string;
 
  
}
