import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ApplyPromoCode, MenuFilterDto, orderInvoiceList, orderList, OrderListSuperDto, OrderPlacedDto, orderSubscriptionsListDto, orderSubscriptionsStatusDto, recent_order_list, RefundDto, RestaurantDetailDto } from './dto/order.dto';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { jwtConstants } from 'src/constants';
import { JwtService } from '@nestjs/jwt';
import { HeatMapQueryDto } from './dto/heat-map-query.dto';
import { Types } from 'mongoose';
import { PayWithWalletDto } from './dto/pay-with-wallet.dto';
import { orderListDto } from 'src/driver/dto/create-driver.dto';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';

@Controller('order')
@ApiTags('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly jwtService: JwtService
  ) { }

  // @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard,RolesGuard)
  @Get('restaurant-detail/:id')
  async RestaurantDetail(@Param('id') id: string, @Request() req, @Query() body: RestaurantDetailDto) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }
    return this.orderService.RestaurantDetail(id, body, user)
  }

  
  // @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @Get('restaurant-menu/:id')
  RestaurantMenu(@Param('id') id: string, @Request() req: any, @Query() body: MenuFilterDto) {
    return this.orderService.RestaurantMenu(id, body, req)
  }


  // @Roles(UsersType.Customer)
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard,RolesGuard)
  @Get('restaurant-menu-guest/:id')
  RestaurantMenuGuest(@Param('id') id: string, @Request() req: any, @Query() body: MenuFilterDto) {
    return this.orderService.RestaurantMenu(id, body, req)
  }


  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('search-restaurant-dish/:id')
  SearchRestaurantDish(@Param('id') id: string, @Query('search') search: string, @Request() req) {
    return this.orderService.SearchRestaurantDish(id, search)
  }

  // @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @Get('available-coupons')
  AvalaibleCoupons(@Query('restaurant_id') restaurant_id: string, @Query('search') search: string, @Request() req) {
    return this.orderService.AvailableCoupon(restaurant_id, search, req)
  }

  // @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @Post('order-placed')
  OrderPlaced(@Request() req, @Body() body: OrderPlacedDto) {
    return this.orderService.OrderPlaced(body, req)
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order listing for admin" })
  @Get('listing')
  OrderListing(@Query() body: orderList) {
    return this.orderService.orderListing(body)
  }

  @Roles(UsersType.GlobalAdmin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({summary:"order listing for the global admin"})
  @Get('listing-globaladmin')
  OrderListingforSuperDuberAdmin(@Request() req, @Query() body: OrderListSuperDto) {
    if (req.payload.scope !== 'globaladmin') {
      throw new Error('Access Denied');
    }
    return this.orderService.orderListingForSuperDuberAdmin(body);
  }


  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order cancel by customer"})
  @Patch(':_id/cancel')
  cancelOrders(@Param('_id') _id: string, @Request() req: any) {
    return this.orderService.cancelOrders(_id, req)
  }
  

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order listing for admin" })
  @Patch(':_id/refund')
  refundOrderAmountByAdmin(@Param('_id') _id: string, @Request() req: any ,@Body() dto : RefundDto ) {
    return this.orderService.refundOrderAmountByAdmin(_id, req, dto)
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order listing for admin" })
  @Patch(':_id/:status')
  updateOrderStatusByAdmin(@Param('_id') _id: string, @Param('status') status: string) {
    return this.orderService.updateOrderStatusByAdmin(_id, status)
  }

  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @Get('order-detail/:order_id')
  OrderDetail(@Param('order_id') order_id: string, @Request() req) {
    return this.orderService.OrderDetail(order_id)
  }


  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('apply-promo-code')
  ApplyPromoCode(@Query() body: ApplyPromoCode) {
    return this.orderService.ApplyPromoCode(body)
  }

  @Get('invoice/:id')
  downloadInvoice(@Param('id') id: string, @Query() body: orderInvoiceList) {
    return this.orderService.downloadInvoice(id, body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order assign driver" })
  @Patch('/:order_id/driver/:driver_id/assign')
  assignDriverByAdmin(@Param('driver_id') driver_id: string, @Param('order_id') order_id: string) {
    return this.orderService.assignDriverByAdmin(driver_id, order_id)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Post('order-placed-for-guest')
  @ApiOperation({ summary: "order placed for guest" })
  OrderPlacedForGuest(@Request() req, @Body() body: CreateGuestOrderDto) {
    return this.orderService.createOrderForGuest(body, req.user)
  }

  @Get("heat-map-table")
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async getOrderAnalyticsTable(@Query() query: HeatMapQueryDto) {
    try {
      return this.orderService.getOrderAnalyticsTable(query);
    } catch (error) {
      throw new Error("Error fetching order analytics table: " + error.message);
    }
  }

  @Get("heat-map")
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async getHeatMapOrders(@Query() query: HeatMapQueryDto) {
    return this.orderService.getOrderHeatMapData(query);
  }

  @Post('pay-with-wallet')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async payWithWallet(@Body() body: OrderPlacedDto, @Request() req) {
    try {
      const user = req.user as any;
      
      // const customerId = user._id;

      return this.orderService.placeOrderWithWallet(
        body,
        user
      );
      
    } catch (error) {
      console.log(error, '<---error in pay with wallet');
      throw new Error("Error processing wallet payment: " + error.message);
    }
  }


  @Get('recommendations')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async getUserRecommendations(@Request() req) {
    try {
      const user = req.user;
      console.log("Fetching recommendations for user:", user);
      return this.orderService.getUserRecommendations(user._id);
    } catch (error) {
      console.error("Error fetching user recommendations:", error);
      throw new Error("Error fetching user recommendations: " + error.message);
    }
  }


  @Get('subscriptions')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "order subscriptions list for vendor, customer, admin " })
  @UseGuards(AuthGuard)
  async orderSubscriptions(@Request() req, @Query() dto : orderSubscriptionsListDto ) {
    try {
      return this.orderService.orderSubscriptions(req , dto);
    } catch (error) {
      throw new Error("Error fetching user orderSubscriptions: " + error.message);
    }
  }


  @Put('subscriptions')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "order subscriptions status update by vendor, customer, admin" })
  @UseGuards(AuthGuard)
  async orderSubscriptionsStatus(@Request() req, @Body() dto : orderSubscriptionsStatusDto ) {
    try {
      return this.orderService.orderSubscriptionsStatus(req , dto);
    } catch (error) {
      throw new Error("Error fetching user orderSubscriptions: " + error.message);
    }
  }


  @Delete('cancel-upcomming-order/:id')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "cancel upcomming subscriptions order by customer"})
  @UseGuards(AuthGuard)
  async cancelSubscriptonOrder(@Request() req, @Param('id') id: string ) {
    try {
      return this.orderService.cancelSubscriptonOrder(req , id);
    } catch (error) {
      throw new Error("Error fetching user orderSubscriptions: " + error.message);
    }
  }



  @Get('create-upcomming-orders')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "create-upcomming-orders by cron for testing" })
  @UseGuards(AuthGuard)
  async CreateUpcommingOrders(@Request() req ) {
    try {
      return await this.orderService.CreateUpcommingOrders();
    } catch (error) {
      throw new Error("Error fetching user orderSubscriptions: " + error.message);
    }
  }


  @Get('handle-upcomming-orders')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "HandleUpcommingOrders by cron for testing" })
  @UseGuards(AuthGuard)
  async HandleUpcommingOrders(@Request() req ) {
    try {
      return await this.orderService.HandleUpcommingOrders();
    } catch (error) {
      throw new Error("Error fetching user HandleUpcommingOrders: " + error.message);
    }
  }

  @Post('status')
  PorterStatusonOrder(@Body() body: any, @Request() req) {
    return this.orderService.porterStatusonOrder( body,req)
  }



  @Post('assign-fixed-time-order-to-driver')
  async assignFixedTimeOrderTotheDriverByCron(@Request() req) {
    return this.orderService.assignFixedTimeOrderTotheDriverByCron()
  }



}
