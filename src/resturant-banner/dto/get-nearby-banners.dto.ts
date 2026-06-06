import { IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { BannerType } from '../entities/resturant-banner.entity';

export class GetNearbyBannersDto {
    @ApiProperty({ example: 30.7333, description: 'Latitude of user location' })
    @IsString()
    lat: string;

    @ApiProperty({ example: 76.7794, description: 'Longitude of user location' })
    @IsString()
    long: string;

    @ApiPropertyOptional({
        default: RestaurantType.Restaurant,
        enum: ["restaurant","grocery" , "pharmacy","electronics", "cloth" ],
      })
    type: BannerType.Restaurant;
}


export class BannerListDto {

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

}

