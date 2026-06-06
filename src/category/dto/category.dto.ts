import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty } from "class-validator";
import { RestaurantType } from "src/vendor/schema/vendor.schema";

export class CreateCatergoryDto{
    
    @ApiProperty()
    category_name:string

    @ApiProperty()
    category_image:string

    @ApiProperty({
        default: RestaurantType.Restaurant,
        enum: RestaurantType,
        description:  `restaurant-type : ${RestaurantType.HomeCookedMeal} , ${RestaurantType.Restaurant} &, ${RestaurantType.BothHomeRest}, ${RestaurantType.Grocery} , ${RestaurantType.Pharmacy} ` 
    })
    restaurant_type: RestaurantType.Restaurant;


    @ApiPropertyOptional({
    example: false,
    })
    @IsNotEmpty()
    @IsBoolean()
    catering_services: boolean;


}

export class FindAllcategory{
    @ApiPropertyOptional()
    search:string
    @ApiProperty()
    page:number
    @ApiProperty()
    limit:number


    

    @ApiPropertyOptional({
    example: false,
    })
    @IsNotEmpty()
    @IsBoolean()
    @Type(() => Boolean) 
    catering_services: boolean;

    @ApiProperty({
        default: RestaurantType.Restaurant,
        enum: RestaurantType,
        description: "Filter by restaurant type"
    })
    restaurant_type: RestaurantType.Restaurant;


}