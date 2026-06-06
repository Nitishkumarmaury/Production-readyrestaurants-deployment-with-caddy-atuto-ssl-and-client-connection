import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateContactusDto {

    @ApiProperty()
    name:string
    @ApiProperty()
    email:string
    @ApiProperty()
    subject:string
    @ApiProperty()
    message:string
}


export class findAllDto {

    @ApiProperty({ 
        default: 'pending', 
        enum: ['pending', 'replied'] 
      })
      status: 'pending' | 'replied' ='replied';
    @ApiProperty()
    page:string
    @ApiProperty()
    limit:string

    @ApiProperty({ default: "" })
    @IsOptional()
    search?:string
}