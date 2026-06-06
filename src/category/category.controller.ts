import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Request, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

import { CreateCatergoryDto, FindAllcategory } from './dto/category.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';

@Controller('category')
@ApiTags('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() body: CreateCatergoryDto,@Request() req) {
    return this.categoryService.create(body,req.payload);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  findAll(@Query() body: FindAllcategory, @Request() req) {
    return this.categoryService.findAll(body, req);
  }

  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  // @Get('for-vendor')
  // VendorFindAll(@Query() body: FindAllcategory,@Request() req) {
  //   return this.categoryService.findAllForVendor(body,req.payload);
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }


  @Put('/:id')
  update(@Param('id') id:string,@Body() body: CreateCatergoryDto) {
    return this.categoryService.update(id,body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Delete('by-vendor/:id')
  removedByVendor(@Param('id') id: string, @Request() req: any) {
    return this.categoryService.removedByVendor(id, req.payload.user_id);
  }
}
