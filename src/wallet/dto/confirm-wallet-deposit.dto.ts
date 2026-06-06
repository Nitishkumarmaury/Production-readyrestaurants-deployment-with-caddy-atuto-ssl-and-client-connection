import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmWalletDepositDto {
    @ApiProperty({
        description: 'Stripe Payment Intent ID',
        example: 'pi_3N5cqK2eZvKYlo2C0xkjbE1a',
    })
    @IsString()
    payment_intent_id: string;

    @ApiProperty({
        description: 'Amount to be credited to wallet (in smallest currency unit, e.g. paise)',
        example: 5000,
    })
    @IsNumber()
    amount: number;
}



