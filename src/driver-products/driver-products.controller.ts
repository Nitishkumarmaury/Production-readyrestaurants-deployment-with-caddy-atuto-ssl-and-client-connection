import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { DriverProductsService } from './driver-products.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { DriverProductDto, DriverProductList, DriverProductOrderDto, EditDriverProductDto, UpdateDriverProductOrderDto } from './dto/driver-product-dto';

@Controller('driver-products')
@ApiTags('driver-products')
export class DriverProductsController {

    constructor(
    private readonly DriverProductsService: DriverProductsService,
    ) { }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: " add driver product" })
    @Post()
    addProduct(@Body() dto : DriverProductDto,  @Request() req) {
        return this.DriverProductsService.addProduct(dto,req.payload);
    }


    // @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: " get driver product" })
    @Get()
    getProduct() {
    return this.DriverProductsService.getProduct();
    }


    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: " delete driver product" })
    @Delete(':id')
    deleteProduct(@Param('id') id : string) {
    return this.DriverProductsService.deleteProduct(id);
    }


    // driver product details 
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "driver product details by id" })
    @Get('details/:id')
    details(@Param('id') id : string) {
    return this.DriverProductsService.details(id);
    }
    
     
    // driver product update 
    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "driver product details by id" })
    @Put('update/:id')
    update(@Param('id') id : string, @Body() dto: EditDriverProductDto ) {
    return this.DriverProductsService.update(id, dto);
    }
    


    @Roles(UsersType.Driver)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "driver buy product" })
    @Post('/order-product')
    orderProduct(@Body() dto: DriverProductOrderDto,  @Request() req ) {
        return this.DriverProductsService.orderProduct(dto, req.payload);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get all driver orders" })
    @Get('orders') // Add '?' to make the parameter optional
    orders(@Query() dto : DriverProductList) { // Add '?' to the parameter type
        return this.DriverProductsService.getorders(dto);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "get order by driver" })
    @Get('orders/:id') // Add '?' to make the parameter optional
    ordersWithId(@Param('id') id: string, @Query() dto : DriverProductList) { // Add '?' to the parameter type
        return this.DriverProductsService.getorders(dto,id);
    }


    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: " get order by driver" })
    @Put('order-product/:id')
    updateOrder(@Param('id') id : string, @Body() dto : UpdateDriverProductOrderDto) {
    return this.DriverProductsService.updateOrder(id, dto);
    }


    



}
