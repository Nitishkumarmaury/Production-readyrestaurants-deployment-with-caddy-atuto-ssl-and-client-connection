import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Put, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, VerifyEmailDto, VerifyOtpDto, VerifyPhoneDto, autoLoginDto, deleteAccountDto, editProfileDto, sentOtpDto } from './dto/auth.dto';

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './guard/auth.guard';
import { Roles } from './decorators/role.decorators';
import { UsersType } from './role/user.role';
import { RolesGuard } from './guard/role.guard';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: "Signup and login for customer" })
  @Post("continue-with-phone")
  async ContinueWithPhone(@Body() body: AuthDto, @Request() req) {
    
    return await this.authService.ContinueWithPhone(body, req);
  }

  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: "Verify phone for customer" })
  @Post("verify-phone")
  async verifyPhone(@Body() body: VerifyPhoneDto, @Request() req) {
    return await this.authService.VerifyPhone(body, req);
  }

  @ApiOperation({ summary: "edit profile for driver and customer" })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Put("edit-profile")
  async editProfile(@Request() req, @Body() body: editProfileDto) {
    return await this.authService.EditProfile(req.payload, body, req.user);
  }

  @ApiOperation({ summary: "Verify email for driver and customer" })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Put("verify-email")
  async verify_email(@Request() req, @Body() body: VerifyEmailDto) {
    return await this.authService.VerifyEmail(req.payload, body, req);
  }

  @ApiOperation({ summary: "Verify phone for driver and customer" })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Put("verify-edit-phone")
  async verify_phone(@Request() req, @Body() body: VerifyEmailDto) {
    return await this.authService.VerifyEditPhone(req.payload, body, req);
  }

  @ApiOperation({ summary: "get profile for driver and customer" })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get("get-profile")
  async getProfile(@Request() req) {
    return await this.authService.getProfile(req.payload, req);
  }

  @ApiOperation({ summary: "edit profile for driver and customer" })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Put("delete-account")
  async dltAccount(@Request() req, @Body() body: deleteAccountDto) {
    return await this.authService.DeleteAccount(req.payload, req, body);
  }


  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'logout' })
  @ApiResponse({ status: 201, description: "Logout Successfully!" })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Delete('/logout')
  logOut(@Request() req) {
    return this.authService.LogOut(req, req.payload)
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'sent otp ' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('/sent-otp')
  sentOTP(@Request() req, @Body() body: sentOtpDto) {
    return this.authService.sentOtp(body, req)
  }


  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'sent otp ' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('/verify/otp')
  VerifyOtp(@Request() req, @Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(req, body)
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Put("update/fcm/token")
  async updateFcmToken(@Request() req, @Query('token') token: string) {
    return await this.authService.UpdateFcmToken(req, token);
  }


  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "regenerate-referral-code" })
  @Get('regenerate-referral-code')
  regenerateReferralCode(@Request() req) {
    return this.authService.regenerateReferralCode(req.payload);
  }





  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'auto-login for admin' })
  @Post('auto-login')
  async autologin(
    @Request() req,
    @Body() dto: autoLoginDto,
  ) {
    return await this.authService.autoLogin(req, dto.id);
  }
}
