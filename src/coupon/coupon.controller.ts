import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto, FindCouponStatusDto, UpdateStatusDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('coupon')
@ApiTags('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}


  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary:"Vendor create coupon"})
  @Post('create-by-vendor/:id')
  createForVendor(@Param('id') id :string,@Body() body: CreateCouponDto,@Request() req) {
    return this.couponService.createForVendor(body,req.payload.user_id,id);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary: 'Add coupon by admin' })
  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary: 'Coupon listing' })
  @Get()
  findAll(@Query() body:FindCouponStatusDto) {
    return this.couponService.findAll(body);
  }

  
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary:"Vendor create coupon"})
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary:"Vendor create coupon"})
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto,@Request() req) {
    return this.couponService.update(id, updateCouponDto,req.user);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary: 'Update coupon by admin' })
  @Put('update/status')
  update_status(@Body() body: UpdateStatusDto) {
    return this.couponService.update_status(body);
  }
  
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary:"Vendor create coupon"})
  @Delete(':id')
  remove(@Param('id') id: string,@Request() req) {
    return this.couponService.remove(id,req.user);
  }
}
