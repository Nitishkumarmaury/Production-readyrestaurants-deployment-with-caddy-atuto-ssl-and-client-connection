import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentResponseType, DocumentType } from '../entities/document.entity';


export class CreateDocumentDto {
  
  @ApiProperty({ enum: DocumentType, example: DocumentType.Driver })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ example: DocumentResponseType.Image, description: 'image | number | both_side_image' })
  @IsString()
  response_type: string;

  @ApiProperty({ example: 'driver license' })
  @IsString()
  document_name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_required: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_expiry: boolean;
}


export class FilterDocumentDto {
  @ApiPropertyOptional({ enum: DocumentType, example: DocumentType.Driver })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;
}
