import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, Min, IsString, IsEnum, ValidateIf } from "class-validator";
export enum referralType {
    CUSTOMER = "CUSTOMER",
    DRIVER = "DRIVER"
}
export class CreateReferralDto {
    @ApiProperty()
    @IsString()
    @IsEnum(referralType)
    type: string;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.CUSTOMER)
    cus_ref_amount?: number;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.DRIVER)
    driver_ref_amount?: number;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.CUSTOMER)
    cus_order_count?: number;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.DRIVER)
    driver_ref_cond_no?: number;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.CUSTOMER)
    no_of_days_for_cus?: number;

    @ApiProperty()
    @IsNumber()
    @ValidateIf(o => o.type === referralType.DRIVER)
    no_of_days_for_driver?: number;
}

export class PaginationDto {

    @ApiProperty({ default: 1 })
    page: number;

    @ApiProperty({ default: 10 })
    limit: number;
}


export class PaginationAdminListDto {

    @ApiProperty({ default: 'customers_referral_info' })
    status: string;

    @ApiProperty({ default: 1 })
    page: number;

    @ApiProperty({ default: 10 })
    limit: number;
}

export class AdminRefHistory {

    @ApiProperty()
    _id: string;

    @ApiProperty({ default: "customer", description: "value = driver or customer" })
    scope: string;

    @ApiProperty({ default: 1 })
    page: number;

    @ApiProperty({ default: 10 })
    limit: number;
}