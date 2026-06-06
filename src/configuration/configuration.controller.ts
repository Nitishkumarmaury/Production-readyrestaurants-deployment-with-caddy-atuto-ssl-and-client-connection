import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { ConfiguratonDto, UpdateConfigurationDto, UpdateConfigurationDtoPartial } from './dto/update-configuration.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('configuration')
@ApiTags('app_configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) { }

  @Get()
  findAll(@Query() dto : ConfiguratonDto, @Request() req  : any) {
    return this.configurationService.findAll(dto, req);
  }

  @Patch()
  @ApiBearerAuth('authorization')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  update(@Body() updateConfigurationDto: UpdateConfigurationDtoPartial) {
    return this.configurationService.update(updateConfigurationDto);
  }
}
