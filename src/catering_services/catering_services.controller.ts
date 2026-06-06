import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CateringServicesService } from './catering_services.service';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { CateringPlanStatusDto, CreateCateringPlanDto, CreatePlateDto, GetPlansDto, PlateBookingDto, PlateBookingStatusDto, UpdateCateringPlanDto } from './dto/catering_services.dto';

@Controller('catering-services')
@ApiTags('catering-services')
export class CateringServicesController {

    constructor(private readonly CateringServicesService: CateringServicesService) {}
    
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"create plan by Admin"})
    @Post('plan')
    createPlan(@Body() dto : CreateCateringPlanDto, @Request() req : any) {
        return this.CateringServicesService.createPlan(dto, req);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"get plans list for vendor, admin, customer"})
    @Get('plans')
    getPlans(@Request() req: any, @Query() dto: GetPlansDto) { // req?any
        return this.CateringServicesService.getPlans(req ,dto);
    }

    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"get plans list for guest"})
    @Get('plans-guest')
    getPlansGuest(@Request() req: any, @Query() dto: GetPlansDto) { // req?any
        return this.CateringServicesService.getPlans(req ,dto);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"delete plans with plan id for admin"})
    @Delete('plans/:id')
    deletePlan(@Param('id') id : string, @Request() req : any) {
        return this.CateringServicesService.deletePlan(id, req);
    }


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"get plan by plan id for vendor, customer and admin"})
    @Get('plans-details/:id')
    planDetails(@Param('id') id : string, @Request() req : any) {
        return this.CateringServicesService.planDetails(id, req);
    }


    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"update plan by plan id for admin"})
    @Patch('plan/:id')
    updatePlan(@Param('id') id : string, @Body() dto :  UpdateCateringPlanDto, @Request() req : any) {
        return this.CateringServicesService.updatePlan(id,dto, req);
    }

    @Roles(UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"plan availabe in restaurant status ( update by vendor)"})
    @Patch('plan-status')
    updatePlanStatus(@Body() dto :  CateringPlanStatusDto, @Request() req : any) {
        return this.CateringServicesService.updatePlanStatus(dto, req);
    }

    // @ApiBearerAuth('authorization')   to show without login also
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"get category list with food items for vendor, customer, admin"})
    @Get('category-list')
    getCategoryList(@Request() req : any) {
        return this.CateringServicesService.getCategoryList(req);
    }



    @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"create plate for customer"})
    @Post('create-plate')
    createPlate(@Body() dto :  CreatePlateDto, @Request() req : any) {
        return this.CateringServicesService.createPlate(dto, req);
    }


    @ApiBearerAuth('authorization')
    @ApiOperation({ summary:"plate booking list by customer_id  and restaurant_id for customer and vendor "})
    @Get('plate-bookings')
    plateBookings(@Query() dto :  PlateBookingDto, @Request() req : any) {
        return this.CateringServicesService.plateBookings(dto, req);
    }


    @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary:"pay full booking amount by plate_id for customer"})
    @Post('complete-booking-amount/:id')
    completeBookingAmount( @Param("id") id :  string, @Request() req : any) {
        return this.CateringServicesService.completeBookingAmount(id, req);
    }

    


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary:"plate status update by customer and vendor"})
    @Patch('plate-status/:id')
    plateStatusUpdate( @Param("id") id :  string, @Body() dto: PlateBookingStatusDto, @Request() req : any) {
        return this.CateringServicesService.plateStatusUpdate(id, dto, req);
    }


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary:"plate details by platd id for customer and vendor"})
    @Get('plate-details/:id')
    plateDetails( @Param("id") id :  string, @Request() req : any) {
        return this.CateringServicesService.plateDetails(id, req);
    }




}
