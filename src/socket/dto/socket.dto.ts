import { ApiProperty } from "@nestjs/swagger"

export class UpdateLocationDto{
    @ApiProperty()
    latitude:string

    @ApiProperty()
    longitude:string

    @ApiProperty()
    heading:string

    @ApiProperty()
    token:string

}