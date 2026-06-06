import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminCustomerDto, CustomerAddressDto, CustomerBlockDto, CustomerListDto, CustomerOrderDto, CustomerWalletHistoryDto, DetailedSearchDto, GetAllRestaurantDto, groceryRestaurentDto, QuickPicksDto, relevantSearchDto, UpdateAddressDto, YourOrdersDto } from './dto/customer.dto';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';


@Controller('customer')
@ApiTags('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
  ) { }



  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: "get all restaurant" })
  @Post('all-restaurant')
  async GetAllRestaurant(@Request() req, @Body() body: GetAllRestaurantDto, @Query('page') page: number, @Query('limit') limit: number) {
    return await this.customerService.GetAllRestaurant(body, page, limit, req.payload?.user_id)
  }

  @ApiOperation({ summary: "get all grocery restaurant" })
  // @Post('all-grocery-restaurant')
  @Post('all-stores')
  async GetAllGroceryRestaurant(
    @Request() req,
    @Body() body:groceryRestaurentDto,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.customerService.GetAllGroceryRestaurant(
      body,
      page,
      limit,
      req.payload?.user_id,
    );
  }


  @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: "get quick picks list" })
  @Post('quick-picks')
  async QuickPicksRestaurant(@Query() body: QuickPicksDto, @Request() req) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }
    // return await this.customerService.QuickPicks(body, user?.user_id)
    return await this.customerService.get_quick_picks_customer(body, user?.user_id)
  }

  @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: "get quick picks list" })
  @Get('quick-picks')
  async get_quick_picks_customer(@Query() body: QuickPicksDto, @Request() req) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }
    return await this.customerService.get_quick_picks_customer(body, user?.user_id)
  }

  @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: "get quick picks list" })
  @Get('relevant-search')
  async search(@Query() body: relevantSearchDto) {
    // return await this.customerService.Search(body)
    return await this.customerService.RelaventSearch(body)
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "get quick picks list" })
  @Get('detailed-search')
  async Detailedsearch(@Query() body: DetailedSearchDto, @Request() req) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }

    return await this.customerService.DetailedSearch(body, user?.user_id)
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "customer orders list" })
  @Get('your-orders')
  async YourOrders(  @Query() dto: YourOrdersDto, @Request() req) {
    return await this.customerService.YourOrderList(dto,  req.payload.user_id)
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "All customer listing for admin" })
  @Get('admin/customer-listing')
  findAll(@Query() body: AdminCustomerDto, @Request() req) {
    return this.customerService.FindAllwithStatus(body, req.payload);
  }



  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "All customer listing for vendor" })
  @Get('listing')
  findAllForVendor(@Query() body: CustomerListDto, @Request() req) {
    return this.customerService.findAllForVendor(body, req.payload);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: " customer detail for admin" })
  @Get('detail/:id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.customerService.customerDetailForAdmin(id, req.payload);
  }
  

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: " customer block for admin" })
  @Put('block')
  blockCustomer(@Query() body: CustomerBlockDto) {
    return this.customerService.block(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: " customer orders for admin" })
  @Get('orders')
  customer_booking(@Query() body: CustomerOrderDto, @Request() req) {
    return this.customerService.customerOrders(body, req.payload);
  }

  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "customer active order" })
  @Get('orders/active')
  async customer_active_orders(@Request() req) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }
    return this.customerService.customerActiveOrders(user);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: " customer orders for admin" })
  @Get('wallet-history/:id')
  walletHistory(@Param('id') id: string, @Query() dto : CustomerWalletHistoryDto,  @Request() req) {
    return this.customerService.walletHistory(id,  dto,req.payload);
  }




}
