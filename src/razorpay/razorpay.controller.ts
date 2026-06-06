import { Body, Controller, Headers, HttpStatus, Param, Post, Req, Request, Res, UseGuards } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { InvoiceDto } from './dto/razorpay.dto';
import { Response } from 'express';

@Controller('razorpay')
@ApiTags('razorpay')
export class RazorpayController {

  constructor(private readonly RazorpayService: RazorpayService) {
  }

  @Post('webhook/:tenantId')
  webhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
    @Req() req: any,
    @Param('tenantId') tenantId: string,
  ) {

    this.RazorpayService.webhook(req, payload, signature, tenantId);
    // console.log('webhook data-------<<<<<<', data);

    return {
      success: true,
      message: 'Webhook successfully processed!',
    };

  }

}
