import { ApiProperty } from "@nestjs/swagger";

export class CreatePricingDto {
    @ApiProperty()
    base_fee:number

    @ApiProperty()
    distance_per_km:number

    @ApiProperty()
    commission_percentage:number

    @ApiProperty()
    tax_percentage:number

}
