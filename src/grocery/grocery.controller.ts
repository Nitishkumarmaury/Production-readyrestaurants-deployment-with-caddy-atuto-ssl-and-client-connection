import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroceryService } from './grocery.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import {
    CreateCartAndOrderDto,
    CreateStockDto,
    GetGroceryListDto,
    groceryDetailDto,
    groceryDetailDtoCusOrVen,
    ListGroceryItemsDto,
    updateGroceryDto,
    GroceryCsvDto,
    simillarDto,
    FindByCategoryDto,
    GetPosListDto
} from './dto/grocery.dto';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';

@ApiTags('grocery')
@Controller('grocery')
export class GroceryController {

    constructor(private readonly GroceryService: GroceryService) { }

    @Get('grocery-detail')
    @Roles(UsersType.Customer, UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(OptionalAuthGuard)
    @ApiOperation({ summary: 'Get grocery item detail with restaurant stock' })
    getGroceryDetail(@Request() req, @Query() dto: groceryDetailDtoCusOrVen) {

        return this.GroceryService.getGroceryDetail(dto, req);
    }



    @Get('similar-items')
    @ApiOperation({ summary: 'Get simillar grocery items by category' })
    async getByCategory(@Request() req, @Query() dto: simillarDto) {
        if (!dto) {
            return { success: false, message: 'Category ID is required' };
        }
        const groceries = await this.GroceryService.getGroceryWithStockByCategory(dto);
        return {
            success: true,
            data: groceries,
        };
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Upload grocery / pharmacy items from CSV" })
    @Post('upload-csv')
    uploadGroceryCsv(@Request() req, @Body() dto: GroceryCsvDto) {
        return this.GroceryService.uploadItemsCsv(req, dto, RestaurantType.Grocery);
    }

    @Get()
    // @Roles(UsersType.Admin)
    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all grocery items list (Admin)' })
    findAllGroceryItems(@Query() dto: ListGroceryItemsDto) {
        return this.GroceryService.findAll(Number(dto.page), Number(dto.limit), dto.search, RestaurantType.Grocery);
    }






    @Post('add-stock')
    @Roles(UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Add or update stock for grocery items by vendor" })
    addStock(@Body() body: CreateStockDto) {
        return this.GroceryService.addOrUpdateStock(body);
    }

    //@Roles(UsersType.Customer)
    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard, RolesGuard)
    // @ApiOperation({ summary: 'Add grocery items to cart and place order' })
    // @Post('grocery-order')
    // async createCartAndOrder(@Request() req, @Body() dto: CreateCartAndOrderDto) {

    //     console.log("req.user", req.payload);
    //     return await this.GroceryService.cartOrderPlaced(dto, req);
    // }

    @Get('list')
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get grocery list with pagination (by user type)' })
    async getListOfGrocery(@Request() req, @Query() query: GetGroceryListDto) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const search = query.search;
        const restaurant_id = query.restaurant_id;
        const category_id = query.category_id;
        return await this.GroceryService.getGroceryGroupedByUserType(
            req,
            page,
            limit,
            restaurant_id,
            category_id,
            search,
            RestaurantType.Grocery

        );
    }

    @Get('list-pos')
    @Roles(UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get grocery list with pagination (by user type)' })
    async getItemForPos(@Request() req, @Query() query: GetPosListDto) {


        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>")
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const search = query.search;
        const category_id = query.category_id;

        return await this.GroceryService.getItemForPos(
            req,
            page,
            limit,
            category_id,
            search,
            RestaurantType.Grocery

        );
    }

    @Get('list-for-guest')
    // @ApiBearerAuth('authorization')
    // @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get grocery list with pagination (by user type)' })
    async getListOfGroceryForGuest(@Request() req, @Query() query: GetGroceryListDto) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const search = query.search;
        const restaurant_id = query.restaurant_id;
        const category_id = query.category_id;
        return await this.GroceryService.getGroceryGroupedByGuestType(
            page,
            limit,
            restaurant_id,
            category_id,
            search,
            RestaurantType.Grocery,
        );
    }

    // Guest API call
    // @Get('grocery/guest')
    // async getGroceryGuest(
    //     @Query() query: GetGroceryListDto
    // ) {
    //     return this.GroceryService.getGroceryForGuest(
    //         Number(query.page ?? 1),
    //         Number(query.limit ?? 10),
    //         query.restaurant_id,
    //         query.category_id,
    //         query.search,
    //     );
    // }


    @Get('by-category')
    @Roles(UsersType.Customer, UsersType.Vendor)
    @ApiBearerAuth('authorization')
    @UseGuards(OptionalAuthGuard)
    @ApiOperation({ summary: 'Get grocery items grouped by category with pagination' })
    findByCategory(@Query() query: FindByCategoryDto, @Request() req) {
        return this.GroceryService.findByCategoryName(query, query.page, query.limit, RestaurantType.Grocery, req);
    }

    @Get(':id')
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get grocery item by id (Admin)' })
    findOneGroceryItem(@Param('id') id: string) {
        return this.GroceryService.findOne(id);
    }


    @Delete(':id')
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete grocery item (Admin)' })
    removeGroceryItem(@Param('id') id: string) {
        return this.GroceryService.remove(id);
    }


    @Put('updateGrocery/:id')
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update grocery item (Admin)' })
    updateGroceryItem(@Param('id') id: string, @Body() dto: updateGroceryDto) {
        return this.GroceryService.update(id, dto);
    }



}
