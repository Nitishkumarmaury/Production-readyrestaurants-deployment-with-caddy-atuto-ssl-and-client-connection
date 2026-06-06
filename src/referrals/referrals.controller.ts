import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { AdminRefHistory, CreateReferralDto, PaginationAdminListDto, PaginationDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) { }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'admin create referral' })
  @Post()
  create(@Body() createRefralDto: CreateReferralDto) {
    return this.referralsService.create(createRefralDto);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'admin find referrals' })
  @ApiBearerAuth('authorization')
  @Get()
  findAll(@Query() query: PaginationAdminListDto) {
    return this.referralsService.findAll(query);
  }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'user referal history.' })
  @Get("history")
  fetchRefralHistory(@Query() body: PaginationDto, @Req() req) {
    return this.referralsService.fetchReferrals(req.payload.user_id, req.payload.scope, body);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'admin customers refrals history' })
  @ApiBearerAuth('authorization')
  @Get("admin/history")
  fetchRefralHistoryForAdmin(@Query() body: AdminRefHistory) {
    return this.referralsService.fetchReferrals(body._id, body.scope, body);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'admin find one refrals' })
  @ApiBearerAuth('authorization')
  @Get(':_id')
  findOne(@Param('_id') _id: string) {
    return this.referralsService.findOne(_id);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'admin update refrals' })
  @ApiBearerAuth('authorization')
  @Patch(':id')
  update(@Param('id') id: string) {
    return this.referralsService.setActive(id);
  }

}
