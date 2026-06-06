import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { UsersType } from 'src/auth/role/user.role';
import { ReportReasonService } from './report-reason.service';
import { ReportDto, ReportListDto } from './dto/report-reason.dto';

@Controller('report-reason')
@ApiTags('report-reason')
export class ReportReasonController {

    constructor(private readonly ReportReasonService: ReportReasonService) { }
    

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "add" })
    @Post()
    add(@Body() dto: ReportDto ,@Request() req) {
    return this.ReportReasonService.add(dto,req);
    }
    

    // @Roles(UsersType.Admin)
    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "list" })
    @Get()
    list(@Query() dto: ReportListDto, @Request() req) {
    return this.ReportReasonService.list(dto, req);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "delete" })
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
    return this.ReportReasonService.delete(id, req);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "delete" })
    @Get(':id')
    reason(@Param('id') id: string, @Request() req) {
    return this.ReportReasonService.reason(id, req);
    }



    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "delete" })
    @Put(':id')
    update(@Param('id') id: string, @Body() dto : ReportDto,  @Request() req) {
    return this.ReportReasonService.update(id, dto,  req);
    }


}
