import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto, findAllDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { query } from 'express';
import { CreateOrderDto } from '../report/dto/create-order.dto';

@Controller('report')
@ApiTags('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createReportDto: CreateReportDto, @Request() req) {
    return this.reportService.create(createReportDto, req.payload.user_id);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() body: findAllDto) {
    return this.reportService.findAll(body);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportService.update(id, updateReportDto);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Delete(':id')
  delete_reports(@Param('id') id: string) {
    return this.reportService.delete_reports(id);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post('orders')
  createOrder(@Body() CreateOrderDto: CreateOrderDto, @Request() req) {
    return this.reportService.orderComplaint(CreateOrderDto, req.payload.user_id);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get('complaints/list')
  getComplaints(@Query() body: findAllDto) {
    return this.reportService.getComplaints(body);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Delete('complaints/:id')
  delete_complaint(@Param('id') id: string) {
    return this.reportService.delete_complaint(id);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Patch('complaints/:id')
  updateComplaint(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportService.updateComplaint(id, updateReportDto);
  }
}
