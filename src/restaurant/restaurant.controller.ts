import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, Query } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { AddDiscountDto, AddFoodDto, CreateRestaurantDto, CreateRestaurantServiceDto, dineOutListDto, GetRestaurantServiceDto, goOnlineDto,  QRCodeDto,  restaurant_request_list_dto, restaurantAdminListingDto, restaurantAdminQuickListingDto, RestaurantBlockDto, RestaurantEarningsDto, RestaurantOrdersDto, restaurantRequestListingDto, restaurantUpdateListingDto, UpdateRestaurantDto, UpdateRestaurantRequestDto, UpdateRestaurantServiceDto } from './dto/restaurant.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { recent_order_list } from 'src/order/dto/order.dto';
import { featuresListDto } from 'src/customer/dto/customer.dto';
import { Slots } from 'src/restaurant/dto/restaurant.dto';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';
import { GetDriversListDto } from './dto/get-drivers-list.dto';
import { SelectDriversDto } from './dto/select-drivers.dto';


@Controller('restaurant')
@ApiTags('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) { }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "features-list" })
  @Get('features-list')
  featuresList(@Query() dto: featuresListDto ,@Request() req) {
    return this.restaurantService.featuresList(dto,req);
  }

  @ApiOperation({ summary: "features-list" })
  @Get('features-list-guest')
  featuresListGuest(@Query() dto: featuresListDto) {
    return this.restaurantService.featuresList(dto);
  }

  @ApiOperation({ summary: "popular-food-item w.r.t restaurant id " })
  @Get('popular-food-item/:id')
  popularFoodItem(@Param('id') id: string ) {
    return this.restaurantService.popularFoodItem(id);
  }

  // @ApiOperation({ summary: "get list on dine out restaurants for customers" })
  // @Get('dine-out')
  // dineOutRestaurants(@Query() dto : dineOutListDto) {
  //   return this.restaurantService.dineOutRestaurants(dto);
  // }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "get report analysis" })
  @Get('earning-orders')
  earningAndOrders(@Request() req,@Query() dto:Slots) {
    return this.restaurantService.EarningAndOrders(req,dto);
  }

  
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "get report analysis" })
  @Get('earning-orders-graph')
  earningAndOrdersGraph(@Request() req,@Query() dto:Slots) {
    return this.restaurantService.EarningAndOrdersGraph(req,dto);
  }


  @ApiOperation({ summary: "get amenities" })
  @Get('amenities')
  amenities() {
    return this.restaurantService.amenities();
  }





  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "add services" })
  @Post('services')
  addServices(@Body() dto: CreateRestaurantServiceDto) {
    return this.restaurantService.addServices(dto);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "update services" })
  @Put('services/:id')
  updateServices(@Body() dto: UpdateRestaurantServiceDto, @Param('id') id : string) {
    return this.restaurantService.updateServices(dto, id);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "delete service" })
  @Delete('services/:id')
  deleteServices(@Param('id') id : string) {
    return this.restaurantService.deleteServices(id);
  }

  @ApiOperation({ summary: "get services" })
  @Get('services')
  services(@Query() dto: GetRestaurantServiceDto) {
    return this.restaurantService.services(dto);
  }

  @ApiOperation({ summary: "get service details" })
  @Get('services/:id')
  serviceDetails(@Param('id') id : string) {
    return this.restaurantService.serviceDetails(id);
  }

  // @ApiOperation({ summary: "get home cooked services" })
  // @Get('home-cooked-services')
  // homeCookedServices() {
  //   return this.restaurantService.homeCookedServices();
  // }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "add our restaurant by admin" })
  @Post()
  create(@Body() body: CreateRestaurantDto, @Request() req) {
    return this.restaurantService.create(body, req);
  }

  // @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor update our restaurant" })
  @Put('/:id')
  updateRestaurant(@Param('id') id: string, @Body() body: UpdateRestaurantDto, @Request() req) {
    return this.restaurantService.Update_(body, id, req);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: "find our restaurant modules" })
  @Get('modules/:id')
  findModules(@Param('id') id: string) {
    return this.restaurantService.findModules(id);
  }


  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor find our restaurant" })
  @Get('/:id')
  find(@Param('id') id: string) {
    return this.restaurantService.find(id);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor find our all restaurant" })
  @Get('')
  findAll(@Request() req) {
    return this.restaurantService.findAll(req.payload.user_id);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant go online" })
  @Put('go-online/offline')
  GoOnlineOffline(@Query() body: goOnlineDto) {
    return this.restaurantService.goOnline(body.restaurant_id, body.status);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "vendor submit verification" })
  @Put('submit/verification')
  submitRestaurantVerification(@Request() req) {
    return this.restaurantService.submitRestaurantVerification(req.user);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant listing for admin" })
  @Get('admin/listing')
  restaurant(@Query() body: restaurantAdminListingDto, @Request() req) {
    return this.restaurantService.restuarantAdminListing(body, req.payload);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant listing for admin" })
  @Get('admin/select/listing')
  restuarant_listing_select_for_quick_picks(@Query() body: restaurantAdminQuickListingDto) {
    return this.restaurantService.restaurant_admin_listing_select_for_quick_picks(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant request listing for admin" })
  @Get('request/listing')
  restaurantRequested(@Query() body: restaurantRequestListingDto) {
    return this.restaurantService.restuarantRequestListing(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant detail for admin" })
  @Get('detail/:id')
  restaurantdetail(@Param('id') id: string) {
    return this.restaurantService.restaurantDetailForAdmin(id);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant update request for admin" })
  @Put('restaurant/request/:_id')
  updateRestaurantRequest(@Body() body: UpdateRestaurantRequestDto, @Param('_id') _id: string) {
    return this.restaurantService.updateRestaurantRequest(_id, body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Admin block rest" })
  @Put('restaurant/block')
  Block(@Query() body: RestaurantBlockDto) {
    return this.restaurantService.Block(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant orders for admin" })
  @Get('order/admin')
  restaurantOrders(@Query() body: RestaurantOrdersDto) {
    return this.restaurantService.restaurantOrders(body);

  }
  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant earnings for admin" })
  @Get('earnings/admin')
  restaurantEarnings(@Query() body: RestaurantEarningsDto) {
    return this.restaurantService.restaurant_earnings(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant menu for admin" })
  @Get('menu/admin')
  restaurantMenu(@Query() body: RestaurantOrdersDto) {
    return this.restaurantService.restaurant_menu(body);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant docs update for admin" })
  @Get('update/listing')
  restaurantUpdateList(@Query() body: restaurantUpdateListingDto) {
    return this.restaurantService.restaurant_updated(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "restaurant request listing for admin" })
  @Get('list/admin')
  restuarant_list_all(@Query() body: restaurant_request_list_dto, @Request() req) {
    return this.restaurantService.restaurant_list_all(body, req.payload);
  }

  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: "order listing" })
  @Get('recent/orders/:restaurant_id')
  recentOrderListsByRestaurantId(@Param('restaurant_id') restaurant_id: string, @Query() body: recent_order_list) {
    return this.restaurantService.recentOrderListsByRestaurantId(restaurant_id, body)
  }




  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "add discount by restaurant" })
  @Post('discount')
  discount(@Body() dto: AddDiscountDto, @Request() req) {
    return this.restaurantService.discount(dto,req);
  }


  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "create qr coder" })
  @Post('qr-code/:id')
  qrCode(@Request() req, @Body() dto: QRCodeDto) {
    return this.restaurantService.qrCode(req, dto);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get drivers list for vendor's restaurant" })
  @Get('drivers/list')
  getDriversList(@Request() req, @Query() dto: GetDriversListDto) {
    return this.restaurantService.getDriversListForVendor(req, dto);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Select drivers for restaurant" })
  @Post('drivers/select')
  selectDrivers(@Request() req, @Body() dto: SelectDriversDto) {
    return this.restaurantService.selectDriversForRestaurant(req, dto);
  }




  




}

