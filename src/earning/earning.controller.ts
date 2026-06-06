import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, Res } from '@nestjs/common';
import { EarningService } from './earning.service';
import { AdminEarningsDto, DriverEarningsDto, ExportEarningDto, RestaurantEarningsDto } from './dto/earning.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Response } from 'express';

@Controller('earning')
@ApiTags('earning')
export class EarningController {
  constructor(private readonly earningService: EarningService) { }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('restaurant')
  findAll(@Query() body: RestaurantEarningsDto) {
    return this.earningService.findAll(body);
  }

  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('driver/earnings')
  driverEarning(@Query() body: DriverEarningsDto, @Request() req) {
    return this.earningService.driverEarnings(body, req.user);
  }

  // @Roles(UsersType.Admin)
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard,RolesGuard)
  @Get('admin/earnings')
  adminEarning(@Query() body: AdminEarningsDto, @Request() req) {
    return this.earningService.adminEarnings(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin earnings export ' })
  @Get("export/earning")
  export_earning(@Query() body: ExportEarningDto) {
    return this.earningService.export_earning(body);
  }


  // @ApiOperation({ summary: 'Admin earnings export ' })
  // @Get("create-test-payout")
  // createTestPayout() {
  //   return this.earningService.earningTransferToVendor()
  // }


}
