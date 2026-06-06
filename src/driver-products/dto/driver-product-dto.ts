import { IsString, IsNotEmpty, IsNumber, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DriverOrderStatus } from '../schema/driver-order-schema';



export class DriverProductDto {
  @ApiProperty({
    description: 'The title of the driver product.',
    example: 'High-Performance Driver Set',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The price of the driver product.',
    example: 99.99,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

   @ApiProperty({
    description: 'currency',
    example: 'INR',
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'A detailed description of the driver product.',
    example: 'A comprehensive set of ergonomic drivers for professional and DIY use.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The URL of the product image.',
    example: 'https://example.com/images/driver-set.jpg',
  })
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @ApiProperty({
    description: 'The URL of the product image.',
    example: ['s','l','xl','xxl'],
  })
  @IsNotEmpty()
  @IsUrl()
  size: string[];


}

export class EditDriverProductDto extends PartialType(DriverProductDto) {}


class DriverAddress {

  @ApiProperty({
      description: 'building_no.',
      example: "houser no 2342",
  })
  building_no: string;

  @ApiProperty({
      description: 'tower.',
      example: "abc tower",
  })
  tower: string;

  @ApiProperty({
      description: 'city',
      example: "city",
  })
  city: string;


  @ApiProperty({
      description: 'area',
      example: "area",
  })
  area: string;


  @ApiProperty({
      description: 'nearby landmark ',
      example: "nearby landmark",
  })
  nearby_landmark: string;




}




class ProductItem {
    @ApiProperty({
        description: 'product_id',
        example: '68a6b167fa3bd9df605bc5bf',
    })
    product_id: string;

    @ApiProperty({
        description: 'quantity of product.',
        example: 4,
    })
    quantity: number;

    @ApiProperty({
        description: 'size',
        example: 'xl',
    })
    size: string;


}

export class DriverProductOrderDto {
    
    @ApiProperty({ type: [ProductItem] })
    cart_items: ProductItem[];


    @ApiProperty({ type: DriverAddress })
    address: DriverAddress;


}


export class UpdateDriverProductOrderDto {

  @ApiProperty({ 
    description: 'The new status of the driver order.',
    enum: DriverOrderStatus, 
    example: DriverOrderStatus.placed 
  })
  @IsNotEmpty()
  @IsEnum(DriverOrderStatus)
  status: DriverOrderStatus;

}



export class DriverProductList {

  @ApiPropertyOptional()
  search: string;

  @ApiPropertyOptional()
  page: number;

  @ApiPropertyOptional()
  limit: number;
}
