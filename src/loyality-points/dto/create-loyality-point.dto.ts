import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsBoolean } from "class-validator";

export class CreateLoyalityPointDto {
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        required: true,
        description: "Number of loyalty points awarded per order",
        example: 10,
    })
    points_per_order: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        required: false,
        description: "Minimum order amount required to earn loyalty points",
        example: 200,
    })
    min_order_amount?: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        required: false,
        description: "Number of days after which earned points will expire",
        example: 180,
    })
    points_expiry_days?: number;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        required: false,
        description: "Indicates if the loyalty program is active",
        example: true,
    })
    is_active?: boolean;
}
