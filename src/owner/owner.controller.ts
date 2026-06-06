import { Body, Controller, Get, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import {
  AddBusinessDto,
  ConnectDomainDto,
  LoginOwnerDto,
  MakePaymentDto,
  RegisterOwnerDto,
  VerifyOwnerOtpDto,
} from './dto/owner.dto';
import { OwnerAuthGuard } from './owner-auth.guard';
import { OwnerService } from './owner.service';

@Controller('ready-delivery/owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post('register')
  register(@Body() dto: RegisterOwnerDto) {
    return this.ownerService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginOwnerDto) {
    return this.ownerService.login(dto);
  }

  @Post('send-otp')
  sendOtp(@Body() dto: LoginOwnerDto) {
    return this.ownerService.sendOtp(dto);
  }

  @Put('verify-otp')
  verifyOtp(@Body() dto: VerifyOwnerOtpDto) {
    return this.ownerService.verifyOtp(dto);
  }

  @Post('add-business')
  @UseGuards(OwnerAuthGuard)
  addBusiness(@Request() req, @Body() dto: AddBusinessDto) {
    return this.ownerService.addBusiness(req.owner._id, dto);
  }

  @Post('domain/connect')
  @UseGuards(OwnerAuthGuard)
  connectDomain(@Request() req, @Body() dto: ConnectDomainDto) {
    return this.ownerService.connectDomain(req.owner._id, dto);
  }

  @Post('domain/verify')
  @UseGuards(OwnerAuthGuard)
  verifyDomain(@Request() req, @Body() dto: ConnectDomainDto) {
    return this.ownerService.verifyDomain(req.owner._id, dto);
  }

  @Get('domain/ask')
  askDomain(@Query('domain') domain: string) {
    return this.ownerService.askDomain(domain);
  }
}

@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('get-subscription-plan-list')
  getPlans(@Query('location') location: string) {
    return this.ownerService.getSubscriptionPlans(location || 'india');
  }

  @Post('make-payment')
  @UseGuards(OwnerAuthGuard)
  makePayment(@Request() req, @Body() dto: MakePaymentDto) {
    return this.ownerService.makePayment(req.owner._id, dto);
  }
}
