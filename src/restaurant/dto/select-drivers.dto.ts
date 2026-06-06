import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class SelectDriversDto {
  @ApiProperty({ 
    description: 'Array of driver IDs to select',
    type: [String],
    example: ['60d5ec49f1b2c8b1f8e4e1a1', '60d5ec49f1b2c8b1f8e4e1a2']
  })
  @IsArray()
  @IsNotEmpty()
  driver_ids: string[];

  @ApiProperty({ 
    type : String , enum : ['select', 'unselect']
  })
  type: string;

}
