import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument, Types } from "mongoose";
import * as mongoose from "mongoose";
import { OrderDeliver } from "../dto/order.dto";
import { WorkingDay } from "src/restaurant/schema/restaurant.schema";


// Define enums for various status and types
export enum OrderType {
    Current = 'current',
    Schedule = 'schedule',
    Pos = 'pos',

    Grocery = 'grocery',
    Pharmacy = "pharmacy",
    Electronics = "electronics",
    Cloth = "cloth",

    Table_order = "table-order",       


}
 


// Define AddOnItem class for any additional items with the food item
export class make_your_own {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}

export class toppings {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}

export class AddOnItem {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}

export class foodSize {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}
export class foodQuantity {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}
export class foodPieces {
    @Prop({ default: null })
    _id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    price: number;
}
// Define FoodItem class for items within the cart
export class FoodItem {
    @Prop({ default: null })
    food_id: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    food_type: string;


    @Prop({ default: null })
    no_of_quantity: number;

    @Prop({ default: null })
    price: number;

    @Prop({ type: foodSize, default: null }) // Optional if not all items have size options
    size?: foodSize;

    @Prop({ type: foodQuantity, default: null }) // Optional if not all items have size options
    quantity?: foodQuantity;

    @Prop({ type: foodPieces, default: null }) // Optional if not all items have size options
    pieces?: foodPieces;


    @Prop({ default: null }) // Optional if not all items have specific cooking requirements
    cooking_req?: string;

    @Prop({ type: [AddOnItem], default: null })
    add_ons?: AddOnItem[]; // Array of add-on items

    @Prop({ type: [toppings], default: null })
    toppings?: toppings[];

    @Prop({ type: [make_your_own], default: null })
    make_your_own?: make_your_own[];

}
export class ReceiverDetail {
    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    phone: string;

    @Prop({ default: null })
    country_code: string;

    @Prop({ default: null })
    email: string;

    @Prop({ default: null })
    gst_no: string;
}

export class GuestDetail {
    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    email: string;

    @Prop({ default: null })
    phone: string;

    @Prop({ default: null })
    country_code: string;
}

export class AddAddress {
    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    lat: string;

    @Prop({ default: null })
    long: string;

    @Prop({ default: null })
    building_no: string;

    @Prop({ default: null })
    tower: string;

    @Prop({ default: null })
    area: string;

    @Prop({ default: null })
    city: string;

    @Prop({ default: null })
    nearby_landmark: string;

    @Prop({ default: null })
    type: string;
}


export class GroceryItems {
  
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category_id: string;
  
    @Prop({ type: String, default: null })
    name: string;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: String, default: null })
    quantity: string;

    @Prop({ type: String, default: null })
    unit: string;
    
    @Prop({ type: Number, default: null })
    price: number;

    @Prop({ type: String, default: null })
    imageUrl: string;


    @Prop({ type: String, default: null })
    cloth_stock_id: string;


    @Prop({ type: String, default: null })
    color_code: string;


    @Prop({ type: String, default: null })
    size: string;

}

export enum PaymentType {
    CashOnDelivery = "cash",
    Card = 'card',
    Wallet = 'wallet',
    UPI = 'upi',
    Pos = 'pos',

}

export enum PaymentStatus {
    Pending = "pending",
    Complete = 'complete',
    Refunded = 'refunded'
}


export enum RefundLiability {
    Driver = "driver",
    Restaurant = "restaurant",
    Both = "both"
}

export enum OrderStatus {
    OrderPending = 'pending',
    OrderPlaced = 'order_placed',
    OrderConfirmed = 'order_confirmed',
    // PreparingOrder = 'preparing_order',  
    ReadyForPickup = 'ready_for_pickup',
    PickedUp = 'picked_up',
    OutForDelivery = 'out_for_delivery',
    // Nearby = 'nearby',                    
    Delivered = 'delivered',
    Cancelled = 'cancelled',
    Failed = 'failed',
    scheduled = 'scheduled',
    upcomming ='upcomming',
    pos ='pos',
    
}

export enum RiderStatus {
    WayToRestaurant = 'way_to_restaurant',
    ReachedAtRestaurant = 'reached_at_restaurant',
    PickedUp = 'picked_up',
    WayToCustomer = 'way_to_customer',
    ReachedAtdelivery = 'reached_at_delivery',
    Delivered = 'delivered',
    Canceled = 'canceled',
}


// Define the main Orders schema
@Schema({ timestamps: true })
export class Orders {
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" })
    restaurant_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Customers" })
    customer_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Drivers", default: null })
    driver_id: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null })
    coupon_id: string;

    @Prop({ default: null })
    order_id: string;

    @Prop({ type: [FoodItem], default: [] })
    cart_items: FoodItem[];

    @Prop({ type: [GroceryItems], default: [] })
    grocery_cart_items:GroceryItems[]

    @Prop({ type: AddAddress, default: null })
    delivery_address: AddAddress;

    @Prop({ default: null })
    note_for_restaurant: string;

    @Prop({ default: null })
    add_delivery_instruction: string;

    @Prop({ type: ReceiverDetail, default: null })
    add_receiver_detail: ReceiverDetail

    @Prop({ type: GuestDetail, default: null })
    add_guest_detail: GuestDetail

    @Prop({ type: String, enum: OrderType, default: OrderType.Current })
    order_type: OrderType;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.OrderPlaced })
    order_status: OrderStatus;

    @Prop({ type: String, enum: RiderStatus, default: null })
    rider_status: RiderStatus;

    @Prop({ type: String, enum: PaymentType, default : null})
    payment_type: PaymentType;

    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
    payment_status: PaymentStatus;

    @Prop({ type: Number, default: null })
    more_time_required_at: number;

    @Prop({ type: Number, default: null })
    add_more_time: number;
        

    @Prop({ default: null })
    order_placed_at: number;

    @Prop({ default: null })
    order_confirmed_at: number;

    @Prop({ default: null })
    order_prepared_at: number;

    @Prop({ default: null })
    order_ready_at: number;

    @Prop({ default: null })
    order_picked_up_at: number;

    @Prop({ default: null })
    order_delivered_at: number;

    @Prop({ default: null })
    order_count_for_restaurant: number;

    @Prop({ default: null })
    estimated_food_ready_time: number;

    @Prop({ default: null })
    estimated_delivery_time: number;

    @Prop({ default: null })
    distance: number;

    @Prop({ default: null })
    cart_amount: number;

    @Prop({ default: null })
    restaurant_rating: number;

    @Prop({ default: null })
    driver_rating: number;

    @Prop({ default: null })
    coupon_amount: number;

    @Prop({ default: 0 })
    delivery_fee: number;

    @Prop({ default: 0 })
    free_delivery_fee: number;

    @Prop({ default: 0 })
    platform_fee: number;

    @Prop({ default: 0 })
    tax_amount: number;

    @Prop({ default: 0 })
    total_amount: number;

    @Prop({ default: null })
    delivered_at: number;

    @Prop({ type: Date, default: null })
    refund_at: Date;


    @Prop({
    required: false,
    enum: RefundLiability,
    default: null
    })
    refund_liability: RefundLiability;


    @Prop({ default: null })
    refund_reason: string;
    

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Drivers', default: [] })
    order_open_for: mongoose.Schema.Types.ObjectId[];

    @Prop({ default: null })
    delivery_otp: string;

    @Prop({ default: null })
    otp_sent_at: number;

    @Prop({ default: null })
    tip_amount: number;

    @Prop({ type: Date, default: null })
    scheduled_time: Date;

    @Prop({ default: null })
    is_open_for_driver: boolean;


    @Prop({ default: null })
    razorpay_order_id: string;

    @Prop({ type: Number, default: moment.utc().valueOf() })
    created_at: number;

    @Prop({ type: Number, default: null })
    updated_at: number;

    @Prop({
    required: false,
    enum: OrderDeliver,
    default: null
    })
    deliver_type: OrderDeliver;

    @Prop({ type: Number, default: 0 })
    order_time_in_minutes: number;

    @Prop({ type: String, default: "" })
    user_order_count: string;

    @Prop({ type: Boolean, default: false })
    is_fixed_time_delivery: boolean;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "ServiceLocation", default: null })
    zone_id: string;

    @Prop({ type: WorkingDay, default: null })
    fixed_time_delivery: WorkingDay;  // order delivery time 


    @Prop({ type: Boolean, default: false })
    is_qr_order: boolean;


    @Prop({ type: String, default: false })
    table_no: string;


}

// Create the Orders document and model
export type OrdersDocument = HydratedDocument<Orders>;
export const OrdersModel = SchemaFactory.createForClass(Orders);










