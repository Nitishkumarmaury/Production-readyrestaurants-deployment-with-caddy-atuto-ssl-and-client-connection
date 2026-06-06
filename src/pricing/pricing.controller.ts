import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('pricing')
@ApiTags('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  create(@Body() createPricingDto: CreatePricingDto) {
    return this.pricingService.create(createPricingDto);
  }

  @Get()
  findAll() {
    return this.pricingService.findAll();
  }

  }

