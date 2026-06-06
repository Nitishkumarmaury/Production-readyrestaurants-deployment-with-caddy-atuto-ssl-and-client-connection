import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { SlotService } from './slot.service';
import { ApiBearerAuth,  ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingListDto, BookingStatusDto, slotBookingDto, slotListDto } from './dto/slot.dto';
import { UsersType } from 'src/auth/role/user.role';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';

@Controller('slot')
@ApiTags('slot')
export class SlotController {
    

    constructor(private readonly SlotService: SlotService) {
     }
  
    @Get('slot-list/:id')
    @ApiOperation({ summary: 'slot-list by restaurant id' })
    slotList(@Param('id') id : string, @Query() dto :  slotListDto ) {
        return this.SlotService.slotList(id, dto);
    }

    @Post('booking')
    @ApiBearerAuth('authorization')
    @Roles(UsersType.Customer)
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "slot booked by customer" })
    async booking(@Body() dto: slotBookingDto, @Request() req) {
    try {
        return this.SlotService.booking(req, dto);
    } catch (error) {
        throw error;
    }
    }
    


    @Get('booking-list')
    @ApiBearerAuth('authorization')
    @Roles(UsersType.Vendor, UsersType.Customer, UsersType.Admin)
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: "booking list for customer , vendor, admin" })
    async bookingList(@Request() req, @Query() dto : BookingListDto) {
    try {
        return this.SlotService.bookingList(req, dto);
    } catch (error) {
        throw error;
    }
    }



    @Put('booking-status')
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "booking status update by customer & vendor & admin " })
    async bookingStatus(@Request() req, @Body() dto : BookingStatusDto) {
    try {
        return this.SlotService.bookingStatus(req, dto);
    } catch (error) {
        throw error;
    }
    }


    @Get('booking-detail/:id')
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: "booking details for customer & vendor" })
    async bookingDetails(@Request() req, @Param('id') id: string) {
    try {
        return this.SlotService.bookingDetails(req, id);
    } catch (error) {
        throw error;
    }
    }


    @Get('detail/:id')
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: "booking details for the dine out booking" })
    async bookingsDetails(@Request() req, @Param('id') id: string) {
        try {
            return this.SlotService.slotDetails( id);
        } catch (error) {
            throw error;
        }
    }



}
