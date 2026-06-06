import { IsString, IsNumber, IsBoolean, IsEnum, IsPositive, Min, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 1. Define the possible status values as an enum for strong typing and validation.
export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Data Transfer Object for creating or updating a Location entity.
 * All fields are optional, making this suitable for PATCH requests.
 * If a field is provided, its validation rules still apply.
 */
export class LocationDto {
  @ApiProperty({
    description: 'The unique name of the location (e.g., city or region name).',
    example: 'kharar',
    minLength: 3,
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The geographical latitude of the location.',
    example: 30.7102616,
    type: 'number',
    format: 'float',
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({
    description: 'The geographical longitude of the location.',
    example: 76.7214608,
    type: 'number',
    format: 'float',
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({
    description: 'The service radius in kilometers (must be a positive number).',
    example: 21,
    minimum: 1,
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1) // Ensure a minimum sensible radius, adjustable based on business logic
  serviceRadius?: number;

  @ApiProperty({
    description: 'The current operational status of the location.',
    example: LocationStatus.ACTIVE,
    enum: LocationStatus,
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiProperty({
    description: 'Indicates if this location is a global or major hub.',
    example: false,
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsBoolean()
  is_global?: boolean;
}


export class ServiceLocationDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
    required: true, // Updated for Swagger documentation
  })
  @IsNumber()
  @IsPositive()
  @Min(1) // Ensure a minimum sensible radius, adjustable based on business logic
  page?: number;


  @ApiProperty({
    example: 20,
    minimum: 1,
    required: true, // Updated for Swagger documentation
  })
  @IsNumber()
  @IsPositive()
  @Min(1) // Ensure a minimum sensible radius, adjustable based on business logic
  limit?: number;


  @ApiProperty({
    description: 'Indicates if this location is a global or major hub.',
    example: false,
    required: false, // Updated for Swagger documentation
  })
  @IsOptional()
  @IsBoolean()
  is_global?: boolean;

}