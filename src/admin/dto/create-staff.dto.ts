import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminPanelPages } from '../schema/admin.schema';

export class CreateSubAdminDto {
    
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Full name of the sub-admin',
        example: 'John Doe',
    })
    name: string;

    @IsEmail()
    @ApiProperty({
        description: 'Email address of the sub-admin (must be unique)',
        example: 'johndoe@example.com',
    })
    email: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Profile image URL (optional)',
        example: 'https://example.com/images/john.jpg',
        required: false,
    })
    image?: string;

    @IsNotEmpty()
    @IsString()
    // @MinLength(6)
    @ApiProperty({
        description: 'Password for the sub-admin (min 6 characters)',
        example: 'P@ssw0rd',
    })
    password: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Country code for phone number',
        example: '+91',
    })
    country_code: string;

    @IsNotEmpty()
    @IsString()
    // @Matches(/^\d{6,15}$/, {
    //     message: 'Phone number must be between 6 to 15 digits',
    // })
    @ApiProperty({
        description: 'Phone number of the sub-admin',
        example: '9876543210',
    })
    phone_no: string;

    @IsArray()
    @IsEnum(AdminPanelPages, { each: true })
    @ApiProperty({
        description: 'List of module permissions for the sub-admin',
        isArray: true,
        enum: AdminPanelPages,
        example: [AdminPanelPages.Dashboard, AdminPanelPages.Customers],
    })
    modules: AdminPanelPages[];
}
