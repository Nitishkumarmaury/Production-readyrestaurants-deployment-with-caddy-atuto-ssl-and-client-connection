import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { CreateFavouriteDto, FavouriteFilterDto } from './dto/create-favourite.dto';
import { UpdateFavouriteDto } from './dto/update-favourite.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';

@Controller('favourite')
@ApiTags('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) { }
  
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Roles(UsersType.Customer)
  @Post('mark-as-fav/dislike')
  create(@Body() body: CreateFavouriteDto, @Request() req) {
    return this.favouriteService.create(body, req.user);
  }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Request() req,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() filter: FavouriteFilterDto
  ) {
    return this.favouriteService.findAll(req.user._id, page, limit, filter);
  }


}
