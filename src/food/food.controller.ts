import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, Query } from '@nestjs/common';
import { FoodService } from './food.service';
import { AddFoodDto, BulkAddFoodDto, FindFoodDto, findMultipleFoodDto, isAvailableDto, makeYouOwnGroup, mostOrderedFoodDto, UpdateFoodDto } from './dto/food.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { UsersType } from 'src/auth/role/user.role';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';


@Controller('food')
@ApiTags('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) { }

  // @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "add food by admin and vendor" })
  @Post('')
  AddFood(@Body() body: AddFoodDto, @Request() req : any) {
    return this.foodService.AddFoodItems(body, req);
  }

  // @Roles( UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @Get('most-ordered')
  async getMostOrderedFoodItemsWithDetails(@Request() req,@Query() dto:mostOrderedFoodDto) {
 
    if (req.payload.scope === UsersType.Customer) {
      throw new Error('Access denied. Only vendors and admins can access this resource.');
    }
    console.log("payload in mostordered food",req.payload);
    
    return await this.foodService.getMostOrderedFoodItemsWithDetails(req, dto);
    // const count = result.length;
    // return {
    //   data_count:count,
    //   success: true,
    //   data: result,
    //   message: 'Most ordered food items fetched successfully',
    // };
  }


  // // @Roles( UsersType.Vendor)
  // @ApiBearerAuth('authorization')
  // @UseGuards(AuthGuard)
  // @Get('most-store-ordered')
  // async getMostOrderedFoodItemsWithDetailsForOthers(@Request() req,@Query() dto:mostOrderedFoodDto) {
 
  //   if (req.payload.scope === UsersType.Customer) {
  //     throw new Error('Access denied. Only vendors and admins can access this resource.');
  //   }
  //   console.log("payload in mostordered food",req.payload);
    
  //   return await this.foodService.getMostOrderedFoodItemsWithDetailsForOthers(req, dto);
  // }



  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor add food" })
  @Post('/:id/bulk-create')
  async BulkAddFood(
    @Param('id') id: string,
    @Body() body: BulkAddFoodDto,
    @Request() req
  ) {
    const resp = await this.foodService.bulkAddFoodItem(id, body, req.user);
    return {
      message: `Food items added successfully!`
    }
  }


  // @Roles(UsersType.Vendor, UsersType.Admin)
  // @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: "find our all food for admin & vendor & customer" })
  @Get('find-all')
  // @Get('find-all/for/vendor')
  findAllForVendor(@Query() body: FindFoodDto, @Request() req) {
    return this.foodService.findAllForVendor(body, req);
  }


  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "food detail" })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodService.findOne(id);
  }

  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "food detail" })
  @Get('find/by/ids')
  findbyIds(@Query() body: findMultipleFoodDto) {
    return this.foodService.findByIds(body);
  }

  // @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "update food by admin" })
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateFoodDto, @Request() req) {
    return this.foodService.update(id, body, req);
  }

  // @Roles(UsersType.Admin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "delete food by admin or vendor" })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.foodService.remove(id, req.user);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor make your own group" })
  @Post('make-your-own-group/:id')
  AddGroup(@Param('id') id: string, @Body() body: makeYouOwnGroup) {
    return this.foodService.addYourOwnGroup(id, body);
  }

  @Roles(UsersType.Vendor)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: "Vendor make your own group" })
  @Put('is-available/:id')
  UpdateIsAvailable(@Param('id') id: string, @Query() body: isAvailableDto) {
    return this.foodService.UpdateIsAvailable(id, body);
  }






}
