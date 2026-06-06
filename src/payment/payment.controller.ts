import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

import { MakePaymentDto } from './dto/payment.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('payment')
@ApiTags('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }


  @Roles(UsersType.Driver)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Post('payment-confirmed/:order_id')
  create(@Param('order_id') order_id: string, @Request() req) {
    return this.paymentService.PaymentConfirmed(order_id);
  }


  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('admin/payout')
  adminPayout(@Query('page') page: number, @Query("limit") limit: number) {
    return this.paymentService.adminPayout(page, limit);
  }

  @ApiOperation({ summary: 'stripe webhoook' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('webhook/:tenantId')
  @HttpCode(HttpStatus.OK) // 👈 Always return 200 if no error
  async webhook(@Request() req: Request, @Body() body: any, @Param('tenantId') tenantId: string ) {

    await this.paymentService.webhook(req.headers, body, tenantId);
    return { received: true }; // Stripe just needs 2xx

    
  }
}
