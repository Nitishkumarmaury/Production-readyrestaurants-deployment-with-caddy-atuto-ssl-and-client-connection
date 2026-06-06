import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { FoodPreference } from "../schema/party-blast.schema";
import { DeliveryAddress } from "src/order/dto/order.dto";

export class createPartyDto {

    
    @ApiProperty({example : "690446a7ae2e92cb3dd628e5"})
    restaurant_id :string


    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the person booking the event',
    })
    @IsString()
    @IsNotEmpty()
    name: string;


    @ApiProperty({ type: DeliveryAddress })
    address: DeliveryAddress;


    @ApiProperty({
        example: '+91-9876543210',
        description: 'Customer phone number',
    })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Customer email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'Birthday Celebration',
        description: 'Type of event requested',
    })
    @IsString()
    @IsNotEmpty()
    event_type: string;

    @ApiProperty({
        example: 150,
        description: 'Number of guests',
    })
    @IsNumber()
    no_of_guest: number;

    @ApiProperty({
        example: '2025-02-15T18:30:00.000Z',
        description: 'Event time in UTC format (ISO Date string)',
    })
    event_time: Date; // or Date

    @ApiProperty({
        example: 'Need a special decoration setup',
        required: false,
        description: 'Additional requirements for the event',
    })
    @IsString()
    @IsOptional()
    additional_request?: string;

    @ApiProperty({
        example: 'veg',
        enum: FoodPreference,
        description: 'Food preference type',
    })
    @IsEnum(FoodPreference)
    food_preferences: FoodPreference;

}


export class partyListDto {

    @ApiProperty({example : 1})
    page :number

    @ApiProperty({example : 20})
    limit :number
}



export class partyListAdminDto{
  
    @ApiProperty({ example: 1 })
    @IsNumber()
    page: number;
  
  
    @ApiProperty({ example: 10 })
    @IsNumber()
    limit: number;
  
    @ApiPropertyOptional({})
    search: string

}



export class PartyListCustomerDto {
    @ApiPropertyOptional({ example:"69242dbf06bd48bafa7223b1"})
    customer_id?: string;

    @ApiPropertyOptional({ example: "690446a7ae2e92cb3dd628e5" })
    restaurant_id?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    page: number;

    @ApiProperty({ example: 10 })
    @IsNumber()
    limit: number;

    // @ApiPropertyOptional()
    // search?: string;
}



