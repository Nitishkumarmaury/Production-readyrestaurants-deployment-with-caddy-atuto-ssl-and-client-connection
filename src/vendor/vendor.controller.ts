import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { VendorService } from './vendor.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { AddMorePreparingTimeDto, OrdersDto, IndexItemDto, TodayOrdersDto, UpdateOrderDto } from './dto/vendor.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('vendor')
@ApiTags('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) { }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('today-order')
  TodayOrders(@Query() body: TodayOrdersDto, @Request() req) {
    return this.vendorService.TodayOrders(body)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('orders')
  Orders(@Query() body: OrdersDto, @Request() req) {
    return this.vendorService.Orders(body)
  }

  // @Roles(UsersType.Vendor)
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard,RolesGuard)
  @Get('order-count/:id')
  OrderCount(@Param('id') id: string, @Request() req) {
    return this.vendorService.OrderCount(id)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('dashboard/ongoing-orders/:id')
  OngoingOrders(@Param('id') id: string, @Request() req) {
    return this.vendorService.OngoingOrders(id)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Put('order_status')
  UpdateOrder(@Query() body: UpdateOrderDto, @Request() req) {
    return this.vendorService.UpdateOrderStatus(body, req.user)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Put('add-more-preparing-time')
  AddMorePreparingTime(@Query() body: AddMorePreparingTimeDto, @Request() req) {
    return this.vendorService.AddMoreTime(body)
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Put('save-index-drag-and-drop/:id')
  SaveIndexForDragDrop(@Param('id') id: string, @Body() body: IndexItemDto) {
    return this.vendorService.SaveIndexForDragDrop(id, body)
  }

}
