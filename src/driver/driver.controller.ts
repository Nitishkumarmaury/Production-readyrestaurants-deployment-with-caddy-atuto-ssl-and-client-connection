import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import {
  CreateDriverDto,
  DriverBlockDto,
  driverOrderListDto,
  findDriverDto,
  findDriverRequestDto,
  findDriverUpdateRequestDto,
  goOnlineDto,
  Listing,
  orderListDto,
  OrderUpdateStatus,
  SetExpiryDateDto,
  UpdateDriveRequest,
  location,
  driverListDto,
  verifyOrder,
  payoutListDto
} from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { restaurant_request_list_dto } from 'src/restaurant/dto/restaurant.dto';

@Controller('driver')
@ApiTags('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) { }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver go online' })
  @Put('go-online/offline')
  GoOnlineOffline(@Query() body: goOnlineDto, @Request() req) {
    return this.driverService.goOnline(body, req.user);
  }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver update order status' })
  @Put('order-status')
  UpdateOrderStatus(@Query() body: OrderUpdateStatus, @Request() req) {
    return this.driverService.UpdateOrderStatus(body, req.user);
  }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver order list' })
  @Get('orders')
  driverOrderList(@Query() body: orderListDto) {
    return this.driverService.orderList(body);
  }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver open order list' })
  @Get('open/orders')
  driverOpenOrderList(@Request() req, @Query() dto: Listing) {
    return this.driverService.openOrders(req.user, dto);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'All driver listing for admin' })
  @Get('admin/listing')
  findAll(@Query() body: findDriverDto, @Request() req) {
    return this.driverService.FindAllwithStatus(body, req.payload);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: ' Driver detail for admin' })
  @Get('detail/:id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.driverService.driver_details(id, req.payload);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: ' driver order list for admin' })
  @Get('order/list')
  driver_bookings(@Query() body: driverOrderListDto) {
    return this.driverService.driverOrderList(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Payout listing (driver/restaurant)' })
  @Get('payout/list')
  async payoutList(@Query() body: payoutListDto) {
    return this.driverService.payoutList(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver request  listing for admin' })
  @Get('request/listing')
  DriverRequests(@Query() body: findDriverRequestDto) {
    return this.driverService.FindDriverRequests(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver request  listing for admin' })
  @Get('update/request')
  DriverUpdateRequests(@Query() body: findDriverUpdateRequestDto) {
    return this.driverService.FindDriverUpdateRequests(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver request  listing for admin' })
  @Get('request/list')
  driverUpdateRequests(@Query() body: restaurant_request_list_dto) {
    return this.driverService.driver_list_all(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update driver status for admin' })
  @Post('set/expiry/date/:id')
  SetExpiryDate(@Param('id') id: string, @Body() body: SetExpiryDateDto) {
    return this.driverService.SetExpiryDate(body, id);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: ' driver block for admin' })
  @Put('block')
  blockDriver(@Query() body: DriverBlockDto) {
    return this.driverService.block(body);
  }

  // @Roles(UsersType.Admin)
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin update driver request' })
  @Put('driver-request/:_id')
  UpdateRequest(@Body() body: UpdateDriveRequest, @Param('_id') _id: string) {
    return this.driverService.UpdateRequest(_id, body);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver earnings for admin' })
  @Get('earnings')
  DriverEarnings(@Query() body: driverOrderListDto) {
    return this.driverService.driverEarningsForAdmin(body);
  }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'driver update location' })
  @Patch('update/location')
  updateLocation(@Query() body: location, @Request() req) {
    return this.driverService.updateLocation(body, req.user);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Drivers doc request listing for admin" })
  @Get('list/admin')
  getDriverDocsList(@Query() body: restaurant_request_list_dto, @Request() req) {
    return this.driverService.getDriver_docs_list_all(body, req.payload);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'get avaliable driver by restarurent location' })
  @Get('avaliable/:restarurent_id')
  getAvaliableDrivers(@Query() dto: driverListDto, @Param('restarurent_id') restarurent_id: string) {
    return this.driverService.getAvaliableDrivers(restarurent_id, dto.search);
  }
}
