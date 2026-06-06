import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Transform } from "class-transformer";
import { Type } from "aws-sdk/clients/glacier";
import { RefundLiability } from "../schema/order.schema";



// Define enums for various status and types
export enum OrderType {
    Current = 'current',
    Schedule = 'schedule',
    Pos = 'pos',

    Grocery = 'grocery',
    Pharmacy = "pharmacy",
    Electronics = "electronics",
    Cloth = "cloth",
    Table_order = "table-order"
}

export enum OrderRange {
    ALL = 'all',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}



export enum Status {
    Active = 'active',
    Completed = 'completed',
    cancelled = 'cancelled',
    failed = 'failed',
    pos = 'pos'
}


export enum RoleType {
    driver = 'driver',
    resturant = 'vendor',
    admin = 'admin',
    customer = 'customer'
}


export class MenuFilterDto {
    @ApiPropertyOptional()
    search: string

    @ApiPropertyOptional()
    veg: boolean

    @ApiPropertyOptional()
    non_veg: boolean

    @ApiPropertyOptional()
    catering_services: boolean;

    @ApiPropertyOptional()
    rating_4_plus: boolean

    // @ApiPropertyOptional({
    //     description: 'Customer ID (taken from logged-in user, not required in request)',
    //     example: '64d8f2a1b3a9c0d2f89d1234',
    //     required: false,
    // })
    // customer_id?: string;
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

export class DeliveryAddress {
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

    @ApiProperty()
    email: string;

    @ApiProperty()
    gst_no: string;

}

class GroceryItem {
    @ApiProperty({ description: 'Grocery item ID' })
    @IsString()
    grocery_id: string;

    @ApiProperty({ description: 'Number of items to order' })
    @IsNumber()
    no_of_quantity: number;

    @ApiProperty({ description: 'Grocery item name' })
    @IsString()
    name?: string;


    @ApiProperty({ description: 'Grocery item quantity' })
    @IsString()
    price?: string;

    @ApiProperty({ description: 'cloth_stock_id' })
    @IsString()
    cloth_stock_id?: string;

    @ApiPropertyOptional({ description: 'cloth color_code' })
    @IsString()
    color_code?: string;

    @ApiPropertyOptional({ description: 'cloth size' })
    @IsString()
    size?: string;
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


export enum OrderSubscriptionStatus {
    Active = "active",
    Cancel = "cancel",
    Pause = "pause"
}

export enum OrderSubscriptionType {

    
    Daily = "daily",
    Weekly = "weekly",
    Monthly = "monthly"
}

export enum OrderDeliver {
    Driver = 'driver',
    TakeAway = 'takeaway',
}

export class OrderPlacedDto {

    @ApiProperty()
    restaurant_id: string

    @ApiProperty({ type: [FoodItem] })
    cart_items: FoodItem[];

    @ApiPropertyOptional({
        type: [GroceryItem],
        description: 'Grocery items - used for grocery orders'
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    grocery_cart_items?: GroceryItem[];  // for the grocery order

    @ApiPropertyOptional({ type: DeliveryAddress, default: null })
    delivery_address: DeliveryAddress;

    @ApiProperty()
    note_for_restaurant: string

    @ApiProperty()
    add_delivery_instruction: string

    @ApiProperty({ type: ReceiverDetail })
    add_receiver_detail: ReceiverDetail

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

    @ApiProperty({ default : 0})
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

    @ApiProperty({
        description: 'Order deliver by driver or takeaway.',
        enum: OrderDeliver,
        example: OrderDeliver.Driver,
    })
    @IsEnum(OrderDeliver)
    readonly deliver_type: OrderDeliver;

    @ApiPropertyOptional({
        description: 'Order Subscription Type by daily, weekly, monthly.',
        enum: OrderSubscriptionType,
        example: OrderSubscriptionType.Daily,
    })
    @IsEnum(OrderSubscriptionType)
    subscription_type: OrderSubscriptionType;

    @ApiPropertyOptional({ example: [1,2,3,4,5]})
    subscription_monthly: [Number]

    @ApiPropertyOptional({ example : ["Monday" , "Tuesday"]})
    subscription_weekly: [String]

    @ApiPropertyOptional()
    order_time: string;


    @ApiPropertyOptional({
        description: 'Order type .',
        enum: OrderType,
    })
    @IsEnum(OrderType)
    order_type: OrderType;
  
    @ApiPropertyOptional({ default: false })
    is_qr_order: boolean;

    @ApiPropertyOptional({ default: false })
    table_no : string
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

    @ApiPropertyOptional({ description: 'Order type filter.', enum: OrderType })
    @IsOptional()
    order_type?: string;
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


export class orderSubscriptionsListDto {

    @ApiProperty({example : 20})
    limit: number

    @ApiProperty({example : 1})
    page: number


    @ApiPropertyOptional({type: String, enum: OrderSubscriptionStatus})
    subscription_status : OrderSubscriptionStatus


    @ApiPropertyOptional({description : "pass customer id and restaurant id for filter data"})
    id: string


}



export class orderSubscriptionsStatusDto {

    @ApiProperty({example : "68db840c4163750209a5542d"})
    id: string

    @ApiProperty({type: String, enum :OrderSubscriptionStatus})
    subscription_status: OrderSubscriptionStatus
}



export class OrderListSuperDto {

    @ApiProperty({
        enum: Status,
        default: Status.Active,
    })
    status: Status;

    @ApiPropertyOptional({
        description: 'Search by order id',
        example: 'ORD123',
    })
    search?: string;

    @ApiProperty({
        example: 10,
        description: 'Number of records per page',
    })
    limit: number;

    @ApiProperty({
        example: 1,
        description: 'Page number',
    })
    page: number;

    @ApiPropertyOptional({
        enum: ['all', 'weekly', 'monthly', 'yearly'],
        default: 'all',
        description: 'Order date range filter',
    })
    range?: OrderRange;


    @ApiPropertyOptional({
        example: 1771871400000,
        description: 'Start date timestamp (milliseconds)',
    })
    start_date?: number;

    @ApiPropertyOptional({
        example: 1771871400000,
        description: 'End date timestamp (milliseconds)',
    })
    end_date?: number;
}


export class RefundDto {

    @ApiProperty()
    refund_reason: string;

    @ApiProperty({ enum: RefundLiability })
    refund_liability: RefundLiability;


}
    
