import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LanguageService } from './language.service';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { LanguageAddDto, LanguageListDto, LanguageUpdateDto } from './dto/language.dto';

@Controller('language')
@ApiTags('language')

export class LanguageController {


      constructor(private readonly LanguageService: LanguageService) {}
    
    
      @Roles(UsersType.Admin)
      @ApiBearerAuth('authorization')
      @UseGuards(AuthGuard, RolesGuard)
      @ApiOperation({ summary: "get list only for admin" })
      @Get()
      list(@Query() dto: LanguageListDto, @Request() req) {
        return this.LanguageService.list(dto, req);
      }
    

      @Roles(UsersType.Admin)
      @ApiBearerAuth('authorization')
      @UseGuards(AuthGuard, RolesGuard)
      @ApiOperation({ summary: "add language only for admin" })
      @Post()
      add(@Body() dto: LanguageAddDto, @Request() req) {
        return this.LanguageService.add(dto, req);
      }


      @Roles(UsersType.Admin)
      @ApiBearerAuth('authorization')
      @UseGuards(AuthGuard, RolesGuard)
      @ApiOperation({ summary: "update language only for admin" })
      @Put(':id')
      update(@Param('id') id: string, @Body() dto: LanguageUpdateDto, @Request() req) {
        return this.LanguageService.update(id,dto, req);
      }

      @Roles(UsersType.Admin)
      @ApiBearerAuth('authorization')
      @UseGuards(AuthGuard, RolesGuard)
      @ApiOperation({ summary: "language detail only for admin" })
      @Get(':id')
      detail(@Param('id') id: string, @Request() req) {
        return this.LanguageService.detail(id, req);
      }


    

}
