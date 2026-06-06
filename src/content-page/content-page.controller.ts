import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContentPageService } from './content-page.service';
import { ContentPageDto, findPageDto } from './dto/content.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { UpdateContentPageDto } from './dto/update-content-page.dto';

@Controller('content-page')
@ApiTags('content-page')
export class ContentPageController {
  constructor(private readonly contentPageService: ContentPageService) {}

 
  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @Get()
  findAll(@Query() body:ContentPageDto) {
    return this.contentPageService.findAll(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentPageService.findOne(id);
  }

  @Get('/:type/:slug')
  find_with_name(@Query() body:findPageDto) {
    return this.contentPageService.find_with_name(body);
  }

  @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContentPageDto: UpdateContentPageDto) {
    return this.contentPageService.update(id, updateContentPageDto);
  }

 
}
