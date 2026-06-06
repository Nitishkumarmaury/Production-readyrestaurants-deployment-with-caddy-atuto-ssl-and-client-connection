import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {  IsArray } from "class-validator";

export class pick_restro {

    @ApiProperty({ default: "" })
    @IsArray()
    restaurant_ids: string[];

}

export class pick_restro_list {

  @ApiPropertyOptional()
  search: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}