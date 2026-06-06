import { ApiProperty } from "@nestjs/swagger";

export class MakePaymentDto {
    @ApiProperty({})
    restaurant_id: string

    @ApiProperty({})
    order_id: string

    // @ApiProperty({})
    // amount: string

    @ApiProperty({ default: "cash" })
    payment_type: string

    // @ApiProperty({})
    // payment_method_id: string
}

export enum PaymentType {
    Cash = 'cash',
    Card = 'card',
    Wallet = 'wallet'
}

export class transferMoneyDto {
    @ApiProperty()
    amount: number

    @ApiProperty()
    destination: string
}