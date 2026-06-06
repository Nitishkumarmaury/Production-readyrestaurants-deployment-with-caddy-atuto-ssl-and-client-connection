import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSosSystemDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: 'John Doe',
        description: 'Name of the emergency contact',
    })
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: '+911234567890',
        description: 'Phone number of the emergency contact',
    })
    phone_number: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Father',
        description: 'Relationship with the contact',
        required: false,
    })
    relationship?: string;
}
