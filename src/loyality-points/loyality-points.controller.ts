import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, Query } from '@nestjs/common';
import { LoyalityPointsService } from './loyality-points.service';
import { CreateLoyalityPointDto } from './dto/create-loyality-point.dto';
import { UpdateLoyalityPointDto } from './dto/update-loyality-point.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { PaginationGetPointDto } from './dto/get-active-pagination.dto';

@Controller('loyality-points')
@ApiTags('loyality-points')
export class LoyalityPointsController {
  constructor(private readonly loyalityPointsService: LoyalityPointsService) { }

  @Post()
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create loyalty point setting (admin)' })
  @ApiBody({ type: CreateLoyalityPointDto })
  async create(@Body() dto: CreateLoyalityPointDto) {
    return this.loyalityPointsService.create(dto);
  }

  @Get('active')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Get active loyalty point settings (customer/admin)' })
  async getActiveSetting(@Query() paginationDto: PaginationGetPointDto) {
    return this.loyalityPointsService.getActiveSetting(paginationDto);
  }

  @Get('get-detail/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Get loyalty point setting by ID' })
  async getById(@Param('id') id: string) {
    return this.loyalityPointsService.getById(id);
  }

  @Put('update-setting/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Update loyalty point setting by ID (admin)' })
  @ApiBody({ type: UpdateLoyalityPointDto })
  async updateById(
    @Param('id') id: string,
    @Body() dto: UpdateLoyalityPointDto,
  ) {
    return this.loyalityPointsService.updateById(id, dto);
  }

  @Get('wallet')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async getWallet(@Request() req) {
    return this.loyalityPointsService.getUserLoyaltyWallet(req.user._id);
  }

  @Get('history')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,    
  ) {
    return this.loyalityPointsService.getUserLoyaltyHistory(req.user._id, +page, +limit);
  }


  @Get('history/:id')
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'history for admin' })
  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getHistoryforAdmiin(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Param('id') id : string    
  ) {
    return this.loyalityPointsService.getUserLoyaltyHistory(id, +page, +limit);
  }




}
