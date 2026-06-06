import { PartialType } from '@nestjs/swagger';
import { CreateResturantBannerDto } from './create-resturant-banner.dto';

export class UpdateResturantBannerDto extends PartialType(CreateResturantBannerDto) {}
