import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger"

export class LanguageListDto {
 

  @ApiPropertyOptional()
  search: string

  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number
}

export class LanguageAddDto {
 
    @ApiProperty()
    key: string

    @ApiProperty()
    english: string

    @ApiProperty()
    hindi: string

}

export class LanguageUpdateDto {

    @ApiProperty()
    english: string

    @ApiProperty()
    hindi: string

}
