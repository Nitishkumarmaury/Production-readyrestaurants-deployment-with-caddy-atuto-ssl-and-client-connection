import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, Min, MinLength, ValidateNested } from "class-validator";
import { DeliveryAddress, OrderDeliver } from "src/order/dto/order.dto";
import { OrderType } from "src/order/schema/order.schema";
import { RestaurantType } from "src/vendor/schema/vendor.schema";

export enum GroceryOrderStatus {
  Placed = 'Placed',
  Pending = 'Pending',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  Delivered = 'Delivered',
}


export class GroceryCsvDto {

  @ApiProperty({ type: [] })
  data: []
}


export enum PaymentType {
  CashOnDelivery = "cash",
  Card = 'card',
  Wallet = 'wallet',
  UPI = 'upi'
}

export enum PaymentStatus {
  Pending = "pending",
  Complete = 'complete',
  Refunded = 'refunded'
}

export enum OrderStatus {
  OrderPending = 'pending',
  OrderPlaced = 'order_placed',
  OrderConfirmed = 'order_confirmed',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Failed = 'failed',

}


export class updateGroceryDto {

  @ApiProperty({ description: 'Name of the grocery item', type: String })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the grocery item', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity of the grocery item', type: String })
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional({ description: 'Unit of the grocery item (e.g., kg, gm)', type: String })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Price of the grocery item', type: Number })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Total stock available for the grocery item', type: Number })
  @IsOptional()
  @IsNumber()
  total_stock?: number;

  @ApiPropertyOptional({ description: 'Image URL of the grocery item', type: String })
  @IsOptional()
  @IsString()
  imageUrl?: string;

}



export class ListGroceryItemsDto {

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: String,
    default: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: String,
    default: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search by grocery name or category name',
    type: String,
    example: 'rice',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}




export class CartItemDto {

  @ApiProperty({
    description: 'Grocery Item ID',
    example: '695cdc2ff00cf1a1428d81d5',
  })
  @IsMongoId()
  grocery_id: string;

  @ApiPropertyOptional({
    description: 'Price of the grocery item (sent by client, verified on server)',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;


  @ApiProperty({
    description: "name of the grocery item",
    example: "Rice"
  })
  @IsOptional()
  @IsString()
  name: string



  @ApiProperty({
    description: 'Quantity of the grocery item',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  no_of_quantity: number;
}

export class CreateCartAndOrderDto {

  @ApiProperty({
    description: 'Restaurant ID',
    example: '65a123abc456def789000111',
  })
  @IsMongoId()
  @IsNotEmpty()
  restaurant_id: string;

  @ApiProperty({
    description: 'List of cart items',
    type: [CartItemDto],
    example: [
      {
        grocery_id: '695cdc2ff00cf1a1428d81d5',
        name: "Rice",
        no_of_quantity: 2,
        price: 150,


      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart_items: CartItemDto[];

  @ApiProperty({ type: DeliveryAddress })
  delivery_address: DeliveryAddress;




  @ApiProperty()
  @IsOptional()
  delivery_fee: number



  @ApiProperty({
    description: 'Order deliver by driver or takeaway.',
    enum: OrderDeliver,
    example: OrderDeliver.Driver,
  })
  @IsEnum(OrderDeliver)
  readonly deliver_type: OrderDeliver;




}






export class UpdateCartDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;
}


export class Cloth {


  @ApiProperty({
    description: 'size',
    example: 'L',
  })
  size: string;

  @ApiProperty({
    description: 'color_code',
    example: '#5555',
  })
  color_code: string;


  @ApiProperty({
    description: 'total_stock',
    example: 250,
  })
  total_stock: number;

}



export class CreateStockDto {

  @ApiProperty({
    description: 'Restaurant ID',
    example: '65a123abc456def789000111',
  })
  @IsMongoId()
  restaurant_id: string;

  @ApiProperty({
    description: 'Grocery Item ID',
    example: '65b123abc456def789000222',
  })
  @IsMongoId()
  grocery_id: string;

  @ApiProperty({
    description: 'Total stock available',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  total_stock: number;



  @ApiProperty({
    type: [Cloth],
  })
  cloths: Cloth[];

}




export class groceryDetailDto {
  @ApiProperty({
    description: 'Grocery Item ID',
    example: '',
  })
  @IsMongoId()
  grocery_id: string;
}


export class groceryDetailDtoCusOrVen {
  @ApiProperty({
    description: 'Grocery Item ID',
    example: '',
  })
  @IsMongoId()
  grocery_id: string;


  @ApiProperty({
    description: 'Restaurant ID',
    example: '',
  })
  @IsMongoId()
  restaurant_id: string;



  @ApiPropertyOptional({
    description: 'Customer ID',
    example: '',
  })
  @IsMongoId()
  customer_id: string;


}


export class GetGroceryListDto {


  @ApiProperty({
    description: 'Restaurant ID',
    example: '65a123abc456def789000111',
  })
  @IsMongoId()
  restaurant_id: string;


  @ApiPropertyOptional({
    description: 'Category ID',
    example: '695b844fc1d0c166d25c045b',
  })
  @IsMongoId()
  category_id: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: String,
    default: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: String,
    default: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;



  @ApiPropertyOptional({
    description: 'Search text for category name or grocery name',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;
}


export class simillarDto {



  @ApiProperty({
    description: 'Restaurant ID',
    example: '65a123abc456def789000111',
  })
  @IsMongoId()
  restaurant_id: string;

  @ApiProperty({
    description: 'Category ID',
    example: '695cdc2ff00cf1a1428d81d5',
  })
  @IsMongoId()
  category_id: string;


  @ApiPropertyOptional({
    description: 'Customer ID',
    example: '',
  })
  @IsMongoId()
  customer_id: string;

}



export class FindByCategoryDto {

  @ApiPropertyOptional({ description: 'Restaurant ID to filter' })
  @IsOptional()
  @IsString()
  restaurant_id?: string;

  @ApiPropertyOptional({ description: 'Category name to filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}


export class GetPosListDto {

  @ApiPropertyOptional({
    description: 'Category ID',
    example: '695b844fc1d0c166d25c045b',
  })
  @IsMongoId()
  category_id: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: String,
    default: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: String,
    default: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;



  @ApiPropertyOptional({
    description: 'Search text for category name or grocery name',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
