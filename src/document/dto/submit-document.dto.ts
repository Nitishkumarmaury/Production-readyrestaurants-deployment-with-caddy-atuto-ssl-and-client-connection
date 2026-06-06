import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SubmitDocumentDto {
  @ApiProperty({ description: 'Requirement ID (document requirement reference)' })
  @IsMongoId()
  @IsNotEmpty()
  requirement_id: string;

  @ApiProperty({ description: 'Driver ID if the document belongs to a driver', required: false })
  @IsMongoId()
  @IsOptional()
  driver_id?: string;

  @ApiProperty({ description: 'Restaurant ID if the document belongs to a restaurant', required: false })
  @IsMongoId()
  @IsOptional()
  restaurant_id?: string;

  @ApiProperty({ description: 'Document value (URL for files, or text/number)' })
  @IsString()
  @IsNotEmpty()
  document_value: string;

  @ApiProperty({ description: 'Document value (URL for files)' })
  @IsString()
  @IsNotEmpty()
  document_value_back: string;

  @ApiProperty({ description: 'Expiry date if applicable', required: false })
  @IsOptional()
  expiry_date?: Date;
}

export class SubmitDocumentsDto {
  @ApiProperty({ type: [SubmitDocumentDto] })
  @ValidateNested({ each: true })
  @Type(() => SubmitDocumentDto)
  documents: SubmitDocumentDto[];
}

export class GetUploadedDocumentsDto {

  // @ApiPropertyOptional({ description: 'Status filter (success, rejected, pending)' })
  // @IsOptional()
  // @IsIn(['success', 'rejected', 'pending'])
  // status?: string;

  @ApiPropertyOptional({ description: 'Driver ID' })
  @IsOptional()
  @IsMongoId()
  driver_id?: string;

  @ApiPropertyOptional({ description: 'Restaurant ID' })
  @IsOptional()
  @IsMongoId()
  restaurant_id?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: string = '1';

  @ApiPropertyOptional({ description: 'Limit per page', default: 10 })
  @IsOptional()
  limit?: string = '10';
}


export class DocumentExpiryDateDto {

  @ApiPropertyOptional({ description: 'uploaded doucument id ' })
  @IsOptional()
  @IsMongoId()
  document_id?: string;


  @ApiPropertyOptional({ description: 'expiry_date timestamp in number ' })
  @IsOptional()
  @IsMongoId()
  expiry_date?: number;


}




export class ApproveRejectDocumentsDto {
  @ApiPropertyOptional({ description: 'Single document ID (approve/reject one)' })
  @IsOptional()
  @IsMongoId()
  document_id?: string;

  @ApiPropertyOptional({ description: 'Driver ID (for approve/reject all)' })
  @IsOptional()
  @IsMongoId()
  driver_id?: string;

  @ApiPropertyOptional({ description: 'Restaurant ID (for approve/reject all)' })
  @IsOptional()
  @IsMongoId()
  restaurant_id?: string;

  @ApiProperty({ description: 'Action (approve_one, reject_one, approve_all, reject_all)' })
  @IsIn(['approve_one', 'reject_one', 'approve_all', 'reject_all'])
  action: string;
}

