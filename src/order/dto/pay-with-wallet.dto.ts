
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class PayWithWalletDto {
    @ApiProperty({ description: 'The ID of the order to pay with wallet' })
    @IsMongoId()
    orderId: string;
}
