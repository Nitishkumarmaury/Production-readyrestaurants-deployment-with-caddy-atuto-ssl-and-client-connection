import { ApiProperty } from "@nestjs/swagger";

export class CustomerAddressDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    building_no: string

    @ApiProperty()
    tower: string

    @ApiProperty()
    area: string

    @ApiProperty()
    city: string
  
    @ApiProperty()
    nearby_landmark: string;
  
    @ApiProperty()
    lat: string;

    @ApiProperty()
    long: string;
  
    @ApiProperty({ default: 'home'})
    type: string
  }


