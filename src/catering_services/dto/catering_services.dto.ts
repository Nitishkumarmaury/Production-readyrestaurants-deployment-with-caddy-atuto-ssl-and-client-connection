import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty } from "class-validator";
import { CateringPlanStatus } from "../schema/catering_plan.schema";

import { DeliveryAddress } from "src/order/dto/order.dto";

import { PlateStatus } from "../schema/plate.schema";



class PlanDetails {

    @ApiProperty()
    category_id:string

    @ApiProperty()
    count:number
}



export class CreateCateringPlanDto{
    
    @ApiProperty()
    name:string

    @ApiProperty()
    price:number


    @ApiProperty()
    kid_price: number;


    @ApiProperty()
    discription: string;

    @ApiProperty({type : String,  enum : CateringPlanStatus, default : CateringPlanStatus.Active })
    @IsEnum(CateringPlanStatus)
    status: CateringPlanStatus;

    @ApiProperty({ type : [PlanDetails] })
    plan_details:[PlanDetails]

}

export class UpdateCateringPlanDto extends PartialType(CreateCateringPlanDto) {}


export class CateringPlanStatusDto {

    @ApiProperty({example : "690496ae35478eb15cdf414e"})
    catering_plan_id :string
    
    @ApiProperty({type : String,  enum : CateringPlanStatus, default : CateringPlanStatus.Active })
    @IsEnum(CateringPlanStatus)
    status: CateringPlanStatus;
}



class MenuDetails {

    @ApiProperty({example : "689087cf063c43075172f59f"})
    category_id:string

    @ApiProperty({example : ["69045063ae2e92cb3dd63ab7", "69045063ae2e92cb3dd63ab7" ]} )
    food_ids :string[]
}

export class CreatePlateDto{
    
    @ApiProperty({example : "690446a7ae2e92cb3dd628e5"})
    restaurant_id :string


    @ApiProperty({example : "690496ae35478eb15cdf414e"})
    catering_plan_id :string


    @ApiProperty({ type : [MenuDetails] })
    menu :[MenuDetails]


    @ApiProperty({example : 10})
    no_of_adults :number


    @ApiProperty({example : 5})
    no_of_kids :number


    @ApiProperty()
    notes :string



    @ApiProperty({ type: DeliveryAddress })
    delivery_address: DeliveryAddress;
    

    @ApiProperty({example : "2025-10-31T00:00:00.000Z"})
    scheduled_time: Date; // ISO format

}


export class PlateBookingDto{
    
    @ApiPropertyOptional({example : "690446a7ae2e92cb3dd628e5"})
    restaurant_id :string


    @ApiPropertyOptional({example : "68ee4eb3048a0903d37a323b"})
    customer_id :string


    @ApiProperty({example : 1})
    page :number


    @ApiProperty({example : 20})
    limit :number

}

export class PlateBookingStatusDto {

    @ApiProperty({type : String,  enum : PlateStatus, default : PlateStatus.Accepted })
    @IsEnum(PlateStatus)
    status: PlateStatus;


}


export class GetPlansDto{
    
    @ApiProperty({example : 1})
    page :number


    @ApiProperty({example : 20})
    limit :number


    @ApiPropertyOptional({})
    search :string

    @ApiPropertyOptional({example : "690446a7ae2e92cb3dd628e5"})
    restaurant_id :string

}