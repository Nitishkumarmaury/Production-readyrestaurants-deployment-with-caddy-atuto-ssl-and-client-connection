import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ServiceLocationService } from './service-location.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { LocationDto, ServiceLocationDto } from './dto/service-location.dto';

@Controller('service-location')
@ApiTags('service-location')
export class ServiceLocationController {


    constructor(private readonly ServiceLocationService: ServiceLocationService) { }

    @Post()
    @ApiBearerAuth('authorization')
    @Roles(UsersType.Admin)
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "add service location only for admin" })
    async createLocationService(@Body() dto: LocationDto, @Request() req) {
    try {
        return this.ServiceLocationService.createLocationService(req.user, dto);
        } catch (error) {
            throw error;
        }
    }
    
    @Get()
    // @ApiBearerAuth('authorization')
    // @Roles(UsersType.Admin)
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get service locations" })
    async serviceLocations(@Query() dto: ServiceLocationDto) {
    try {
        return this.ServiceLocationService.serviceLocations(dto);
        } catch (error) {
            throw error;
        }
    }


    @Delete(":id")
    @ApiBearerAuth('authorization')
    @Roles(UsersType.Admin)
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "delete service location only for admin" })
    async deleteLocationService(@Param('id') id: string) {
    try {
        return this.ServiceLocationService.deleteLocationService(id);
        } catch (error) {
            throw error;
        }
    }

    @Get(":id")
    @ApiBearerAuth('authorization')
    @Roles(UsersType.Admin)
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get service location only for admin" })
    async locationService(@Param('id') id: string) {
    try {
        return this.ServiceLocationService.locationService(id);
        } catch (error) {
            throw error;
        }
    }



}
