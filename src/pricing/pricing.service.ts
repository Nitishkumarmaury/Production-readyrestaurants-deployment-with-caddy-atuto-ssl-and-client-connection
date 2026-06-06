import { Injectable } from '@nestjs/common';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { DbService } from 'src/db/db.service';

@Injectable()
export class PricingService {
  constructor(private readonly model:DbService){}
 async  create(createPricingDto: CreatePricingDto) {
  try {
    const data= await this.model.pricing.create(createPricingDto)
    return{data:data}
  } catch (error) {
    throw error
  }
  }

 async findAll() {
  try {
    const data=await this.model.pricing.findOne()
    return {data:data}
  } catch (error) {
    throw error
  }
  }

}
