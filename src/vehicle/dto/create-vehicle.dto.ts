import { ApiProperty } from "@nestjs/swagger";

export class CreateVehicleDto {
    
    @ApiProperty()
    name?:string
}
