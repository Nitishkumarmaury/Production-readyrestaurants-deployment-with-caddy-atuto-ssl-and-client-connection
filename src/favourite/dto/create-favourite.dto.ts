import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFavouriteDto {
    @ApiProperty({
        description: "ID of the restaurant (optional if favouriting a food item)",
        example: "64b1f6a5d2f9e6b123456789",
        required: false,
    })
    restaurant_id?: string;

    @ApiProperty({
        description: "ID of the food item (optional if favouriting a restaurant)",
        example: "64b1f6a5d2f9e6b987654321",
        required: false,
    })
    food_item_id?: string;

    @ApiPropertyOptional({
        description: "ID of the grocery item (optional if favouriting a restaurant or food item)",
        example: "695f3ddecc725fdae442bc9e",
    })
    grocery_item_id?: string;

    @ApiProperty()
    status: string;


    @ApiPropertyOptional({
        description: "only required if favouriting a food item",
        example: "64b1f6a5d2f9e6b123456789",
        required: false,
    })
    food_restaurant_id?: string;


}

export class FavouriteFilterDto {
    @ApiPropertyOptional({
        description: "Filter favourites by type. Allowed values: 'restaurant', 'food_item' or 'grocery_item'. By default returns all.",
        example: "restaurant",
    })
    type?: 'restaurant' | 'food_item' | 'grocery_item';

    @ApiPropertyOptional()
    order_type: string;

}
