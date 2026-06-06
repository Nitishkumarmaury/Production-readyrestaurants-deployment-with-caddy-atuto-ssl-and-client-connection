import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { AddItemDto, CustomerCreateSubscriptionDto, ItemListDto, ItemStatusDto, listOrderSubscriptionDto, listSubscriptionDto, OrderSubscripitionStatus, UpdateItemDto, UpdateOrderStatusDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { CustomerCreateSubscription } from './schema/customerSubscription.schema';
import { query } from 'express';



@Controller('subscriptions')
@ApiTags('subscriptions')
export class SubscriptionsController {

    constructor(private readonly SubscriptionsService: SubscriptionsService) { }



    @Post('admin/test/create-daily-orders')
    @ApiOperation({
        summary: 'TEST: Manually trigger daily subscription order creation',
        description: 'Creates subscription orders for today. Safe to run multiple times - will not create duplicates.'
    })
async testCreateDailyOrders() {
        try {
            const startTime = Date.now();
            console.log(' Manual trigger: Creating daily subscription orders...');

            await this.SubscriptionsService.createDailySubscriptionOrders();

            const duration = Date.now() - startTime;

            return {
                success: true,
                message: 'Daily subscription orders creation completed',
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to create daily orders',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }




    @Patch('customer-order/status')
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({
        summary: 'Update subscription order status like delivered or cancelled',
    })

    async updateOrderStatus(
        @Body() dto: UpdateOrderStatusDto,
        @Request() req: any,
    ) {
        return this.SubscriptionsService.updateOrderSubscriptionStatus(
            dto.id,
            dto.status,
            req,
        );
    }

    





    // List of services for create subscription
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get customer subscription list based on user role for create subscription' })
    @Get('list')
    async getSubscriptionList(
        @Request() req,
        @Query() dto: listSubscriptionDto,
    
    ) {
       

         console.log('User info from guard:', req.user);     // incase of admin this will give undefined because their is no case of handling admin login in auth guard 
         console.log('JWT payload from guard:', req.payload); // playload have information about every user 

        return await this.SubscriptionsService.getSubscriptionList(req, dto);
    }


    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get list of the customer order subscriptions by role like user , customer and admin' })
    @Get('orderlist')
    async getOrderSubscriptionList(
        @Request() req: any,
        @Query() dto: listOrderSubscriptionDto
    ) {
     

        return await this.SubscriptionsService.getOrderSubscriptionList(req,dto);
    }












    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "add subsctiption item by admin" })
    @Post()
    addItem(@Body() dto: AddItemDto, @Request() req) {
        return this.SubscriptionsService.addItem(dto, req);
    }

    // @Roles(UsersType.Admin)
    @ApiOperation({ summary: "Get subscription items (defaults to customer view if unauthenticated or Guset)" })
    @Get('guest/item-list')
    itemList(@Query() dto: ItemListDto, @Request() req) {
        if(!req.payload){  // if user is not logged in
            req.payload = { scope : UsersType.Customer};
        }
        return this.SubscriptionsService.itemList(dto, req);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: " subsctiption item list for by admin, vendor and customer" })
    @Get('')
    gustItemList(@Query() dto: ItemListDto, @Request() req) {
        if(!req.payload){
            req.payload = { scope : UsersType.Customer};
        }
        return this.SubscriptionsService.itemList(dto, req);
    }





    // Customer create subscription service ak..
    @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Create a customer subscripton only by  customer" })
    @Post("customer")
    createSubscrition(@Request() req, @Body() dto: CustomerCreateSubscriptionDto) {
        return this.SubscriptionsService.createSubscription(req, dto);
    }

    // @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Admin ,Vendor and Customer can activate, pause, or cancel customer subscription' })
    @Put('customer/status')
    async updateSubscriptionStatus(
        @Body() dto: UpdateSubscriptionStatusDto,
    ) {
        return this.SubscriptionsService.updateSubscriptionStatus(dto);
    }

    




    // dynamic routes are at the bottom for solving the problem of routing conflicts

    // get customercreatesubscripition detail for admin only

    
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get customer created subscripition detail for admin only" })
    @Get('listSubscription/:id')
    getCreateSubscribtionDetail(@Param('id') id: string, @Request() req) {
        return this.SubscriptionsService.getCreateSubscribtionDetail(id,req);
    }





    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "subsctiption item update for by admin" })
    @Put(':id')
    updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto, @Request() req) {
        return this.SubscriptionsService.updateItem(dto, id, req);
    }





    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "subsctiption item update for by admin" })
    @Get(':id')
    itemDetail(@Param('id') id: string) { // , @Request() req)
        return this.SubscriptionsService.itemDetail(id);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "subsctiption item delete for by admin" })
    @Delete(':id')
    itemDelete(@Param('id') id: string, @Request() req) {
        return this.SubscriptionsService.itemDelete(id, req);
    }

    @Roles(UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "subsctiption item status update for by vendor" })
    @Put('status/:id')
    updateStatus(@Param('id') id: string, @Body() dto: ItemStatusDto, @Request() req) {
        return this.SubscriptionsService.updateStatus(dto, id, req);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get order detail by id for admin only" })
    @Get('orderDetail/:id')
    orderDetailAdminOnly(@Param('id') id: string, @Request() req) {
        return this.SubscriptionsService.orderDetailAdmin(id,req);
    }

    
}
