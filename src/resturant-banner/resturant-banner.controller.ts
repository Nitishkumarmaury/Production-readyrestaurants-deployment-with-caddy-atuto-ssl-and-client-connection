import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Request, Query } from '@nestjs/common';
import { ResturantBannerService } from './resturant-banner.service';
import { CreateResturantBannerDto } from './dto/create-resturant-banner.dto';
import { UpdateResturantBannerDto } from './dto/update-resturant-banner.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { BannerListDto, GetNearbyBannersDto } from './dto/get-nearby-banners.dto';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('resturant-banner')
@ApiTags('resturant-banner')
export class ResturantBannerController {
  constructor(private readonly resturantBannerService: ResturantBannerService) { }

  @Post()
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary: "Add banner for resturant(By Resturant only)." })
  @ApiBody({ type: CreateResturantBannerDto })
  async createBanner( @Body() dto: CreateResturantBannerDto, @Request() req) {
    try {
      
      return this.resturantBannerService.createBanner(req, dto);
    } catch (error) {
      throw error;
    }
  }

  @Get('user')
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get banners for restaurants (User only)' })
  async getUserAppBanners(
    @Request() req,
    @Query() dto: GetNearbyBannersDto,
  ) {
    try {
      return this.resturantBannerService.getBannersForUserApp(req.user, dto);
    } catch (error) {
      throw error;
    }
  }

  @Get("/guest")
  @ApiOperation({ summary: "get banners list. for guest" })
  async resturantBannersGuest(@Query() dto: BannerListDto, @Request() req) {
    try {
      return this.resturantBannerService.resturantBanneres(dto, req);
    } catch (error) {
      throw error;
    }
  }


  @Get('detail/:id')
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get banner details ' })
  async getBannerDetails(
    @Request() req,
    @Param('id') id: string,
  ) {
    try {
      return this.resturantBannerService.getBannerDetails(id);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "get banners list. for admin, customer, and vendor" })
  async resturantBanneres(@Query() dto: BannerListDto, @Request() req) {
    try {
      return this.resturantBannerService.resturantBanneres(dto, req);
    } catch (error) {
      throw error;
    }
  }




  @Get('admin-resturant')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get banners list for a restaurant (Resturant only).' })
  async getAllAdminBanners(@Query('restaurant_id') restaurantId: string) {
    return this.resturantBannerService.getAllBannersForAdmin(restaurantId);
  }

  @Get(':id')
  @ApiBearerAuth('authorization')
  @Roles(UsersType.Vendor)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "get resturant banners(By Resturant only)." })
  async resturantBanners(@Param('id') id: string, @Request() req) {
    try {
      return this.resturantBannerService.resturantBanners(id, req);
    } catch (error) {
      throw error;
    }
  }


  @Put(':id')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Update banner for resturant(Admin only)." })
  @ApiBody({ type: UpdateResturantBannerDto })
  async updateBanner(@Param('id') id: string, @Body() dto: Partial<CreateResturantBannerDto>) {
    return this.resturantBannerService.updateBanner(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Delete banner(Admin only)." })
  async deleteBanner(@Param('id') id: string) {
    return this.resturantBannerService.deleteBanner(id);
  }

  @Patch(':id/status/:status')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Activate or deactivate a banner (Admin only).' })
  async toggleBannerStatus(
    @Param('id') id: string,
    @Param('status') status: 'active' | 'inactive',
  ) {
    return this.resturantBannerService.toggleBannerStatus(id, status);
  }
}
