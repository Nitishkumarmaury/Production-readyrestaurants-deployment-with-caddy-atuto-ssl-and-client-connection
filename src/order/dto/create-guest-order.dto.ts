import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { Type } from "aws-sdk/clients/glacier";
export enum Status {
    Active = 'active',
    Completed = 'completed',
    cancelled = 'cancelled',
    failed = 'failed'
}

export enum RoleType {
    driver = 'driver',
    resturant = 'vendor',
    admin = 'admin',
    customer = 'customer'
}
export class MenuFilterDto {
    @ApiPropertyOptional()
    search: boolean

    @ApiPropertyOptional()
    veg: boolean

    @ApiPropertyOptional()
    non_veg: boolean

    @ApiPropertyOptional()
    rating_4_plus: boolean
}


class AddOnItem {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}
class foodSize {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}
class foodPieces {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}
class foodQuantity {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}

class toppings {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}

class make_your_own {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;
}

class DeliveryAddress {
    @ApiProperty()
    name: string;

    @ApiProperty()
    lat: string;

    @ApiProperty()
    long: string;

    @ApiProperty()
    building_no: string;

    @ApiProperty()
    tower: string;

    @ApiProperty()
    area: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    nearby_landmark: string;

    @ApiProperty()
    type: string;
}

class ReceiverDetail {
    @ApiProperty()
    name: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    country_code: string;
}


class GuestDetail {
    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    country_code: string;
}

class FoodItem {
    @ApiProperty()
    food_id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    food_type: string;

    @ApiProperty()
    no_of_quantity: number;

    @ApiProperty()
    price: number;

    @ApiProperty({ type: foodSize })
    size?: foodSize;

    @ApiProperty({ type: foodQuantity })
    quantity?: foodQuantity;

    @ApiProperty({ type: foodPieces })
    pieces?: foodPieces;

    @ApiProperty({ type: [AddOnItem] })
    add_ons: AddOnItem[];

    @ApiProperty({ type: [make_your_own] })
    make_your_own: make_your_own[];

    @ApiProperty({ type: [toppings] })
    toppings: toppings[];

    @ApiProperty()
    cooking_req?: string;

}



export class CreateGuestOrderDto {
    @ApiProperty()
    restaurant_id: string

    @ApiProperty({ type: [FoodItem] })
    cart_items: FoodItem[];

    @ApiProperty({ type: DeliveryAddress })
    delivery_address: DeliveryAddress;

    @ApiProperty()
    note_for_restaurant: string

    @ApiProperty()
    add_delivery_instruction: string

    @ApiProperty({ type: ReceiverDetail })
    add_receiver_detail: ReceiverDetail

    @ApiProperty({ type: GuestDetail })
    add_guest_detail: GuestDetail

    @ApiProperty()
    payment_type: string

    @ApiProperty({})
    coupon_id: string

    @ApiProperty({})
    payment_method_id: string;


    @ApiProperty()
    cart_amount: number

    @ApiProperty()
    delivery_fee: number

    @ApiProperty()
    platform_fee: number

    @ApiProperty()
    tax_amount: number

    @ApiProperty()
    coupon_amount: number

    @ApiProperty({})
    total_amount: number

    @ApiProperty({})
    estimated_food_ready_time: number;

    @ApiPropertyOptional({ default: false })
    is_scheduled?: boolean;

    @ApiProperty({})
    scheduled_time: string; // ISO format

    @ApiProperty()
    @IsIn([5, 20, 50, 100], {
        message: 'Tip amount must be one of 5, 20, 50, or 100',
    })
    @IsNumber()
    tip_amount?: number;
}


export class ApplyPromoCode {
    @ApiProperty()
    promo_code: string

    @ApiProperty()
    min_food_amount: number
}

export class orderList {
    @ApiProperty({ enum: Status, default: Status.Active })
    status: Status

    @ApiProperty()
    @ApiPropertyOptional()
    search: string

    @ApiProperty()
    limit: number

    @ApiProperty()
    page: number

}

export class orderInvoiceList {

    @ApiProperty({ enum: RoleType, default: RoleType.customer })
    type: RoleType

}

export class recent_order_list {

    @Transform(({ value }) => parseInt(value))
    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    page: number;

    @Transform(({ value }) => parseInt(value))
    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    limit: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

}
export class RestaurantDetailDto {

    @ApiProperty({ required: false })
    lat: string

    @ApiProperty({ required: false })
    long: string
}
