import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecryptDataDto {

    @ApiProperty({
        default: 'customer',
        enum: ['customer', 'driver', 'vendor', 'restaurant'],
        description: 'User type: customer, driver, or vendor'
    })
    type: 'customer' | 'driver' | 'restaurant' | 'vendor' = 'customer';

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    field: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    password: string;
}
