import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { DealService } from './deal.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { allDealListCustomerDto, allDealListDto, allDealListRestaurantealsDto, BuyDealDto, CreateDealDto, DealListDto, DealOrderStatusDto, DealStatusDto, orderListDto, UpdateDealDto } from './dto/deal.dto';

@Controller('deal')
@ApiTags("deal")
export class DealController {

    constructor(
        private readonly DealService: DealService,
    ) { }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Create deal by admin" })
    @Post('create')
    create(@Body() dto: CreateDealDto, @Request() req) {
        return this.DealService.create(dto);
    }


    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "update deal by admin" })
    @Put('update/:id')
    update(@Body() dto: UpdateDealDto, @Param('id') id: string, @Request() req) {
        return this.DealService.update(dto, id);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "delete deal by admin" })
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        return this.DealService.delete(id);
    }

    // @Roles(UsersType.Admin)
    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal details for all" })
    @Get('details/:id')
    details(@Param('id') id: string) {   //, @Request() req if needed 
        return this.DealService.details(id);
    }

    @ApiOperation({ summary: "deal list for admin" })
    @Get('deal-list')
    dealList(@Query() dto:allDealListDto) {
        return this.DealService.dealList(dto);
    }


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth('authorization')
    @ApiOperation({ summary: "deals list for vender customer and admin" })
    @Get()
    list(@Request() req, @Query() dto: DealListDto) {

        return this.DealService.list(req, dto);
    }

    @ApiOperation({ summary: "deals list for guest" })
    @Get("list-for-guest")
    listforGuest(@Request() req, @Query() dto: DealListDto) {
        return this.DealService.listforGuest(req, dto);
    }



    @Roles(UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal availabe in restaurant status ( update by vendor)" })
    @Patch('status/:id')
    updateStatus(@Param('id') id: string, @Body() dto: DealStatusDto, @Request() req: any) {
        return this.DealService.updateStatus(id, dto, req);
    }

    @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal buy by customer" })
    @Post('buy')
    buy(@Body() dto: BuyDealDto, @Request() req: any) {
        return this.DealService.buy(dto, req);
    }


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal order list for customer and vendor" })
    @Get('order-list')
    orderList(@Query() dto: orderListDto, @Request() req: any) {
        return this.DealService.orderList(dto, req);
    }



    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal order status manage by customer, vendor and admin " })
    @Put('order-status')
    orderStatus(@Body() dto: DealOrderStatusDto, @Request() req: any) {
        return this.DealService.orderStatus(dto, req);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deals list for customer only on the basis of customer_id" })
    @Get('customer-deals')
    customerDeals(@Query() dto: allDealListCustomerDto) {
            return this.DealService.customerDeals(dto);
    }
    
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deals list for customer only on the basis of restaurant_id" })
    @Get('restaurant-deals')
    restauranteals(@Query() dto: allDealListRestaurantealsDto) {
        return this.DealService.restaurantDeals(dto);
    }


    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "deal order details for customer and vendor" })
    @Get('order/:id')
    orderDetails(@Param('id') id: string, @Request() req: any) {
        return this.DealService.orderDetails(id, req);
    }
    
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({summary:"Deals buy details for admin"})
    @Get('deal-detail/:id')
    getOrderWithDetails(@Param('id') id: string) {
      
        return this.DealService.getdealWithDetails(id);
    
    }






}
