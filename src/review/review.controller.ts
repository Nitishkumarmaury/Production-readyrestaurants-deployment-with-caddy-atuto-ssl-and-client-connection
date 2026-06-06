import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ReviewService } from './review.service';

import { RateCustomerDto, RateDriverDto, RateRestaurantDto } from './dto/review.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('review')
@ApiTags("review")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }



  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post('rate-restaurant')
  create(@Body() body: RateRestaurantDto, @Request() req) {
    return this.reviewService.RateRestaurant(body, req.payload);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post('rate/driver')
  RateDriver(@Body() body: RateDriverDto, @Request() req) {
    return this.reviewService.rateDriver(body, req.payload);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Post('rate/customer')
  RateCustomer(@Body() body: RateCustomerDto, @Request() req) {
    return this.reviewService.rateCustomer(body, req.payload);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get('customer-review/:customer_id')
  getCustomerReview(
    @Param('customer_id') customer_id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.reviewService.customerReview(customer_id, page, limit);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get('restaurant-review/:restaurant_id')
  getRestaurantReview(@Param('restaurant_id') restaurant_id: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.reviewService.RestaurantReview(restaurant_id, page, limit);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get('driver-review/:driver_id')
  getDriverReview(@Param('driver_id') driver_id: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.reviewService.driverReview(driver_id, page, limit);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Vendor add our restaurant" })
  @Get('vendor-review-listing')
  reviewListing(@Request() req, @Query('page') page: number, @Query('limit') limit: number) {
    return this.reviewService.vendorReviewListing(req.payload, page, limit);
  }

}
