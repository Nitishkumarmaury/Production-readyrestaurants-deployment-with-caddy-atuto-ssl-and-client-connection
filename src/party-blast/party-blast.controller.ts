import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PartyBlastService } from './party-blast.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { UsersType } from 'src/auth/role/user.role';
import { createPartyDto,  partyListAdminDto,  PartyListCustomerDto,  partyListDto } from './dto/party-blast.dto';

@Controller('party-blast')
@ApiTags("party-blast")
export class PartyBlastController {

    constructor(
    private readonly PartyBlastService: PartyBlastService,
    ) { }


    @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Create party by customer" })
    @Post('create')
    create(@Body() dto: createPartyDto, @Request() req) {
    return this.PartyBlastService.create(dto, req);
    }

    // @Roles(UsersType.Customer)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: "party list  for customer and vendor" })
    @Get('list')
    list(@Query() dto: partyListDto, @Request() req) {
    return this.PartyBlastService.list(dto, req);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard,RolesGuard)
    @ApiOperation({ summary: "list of partyblast buy by admin" })
    @Get('admin-list')
    customerPartyBlastDetails(@Query() dto: partyListAdminDto)
    {
        return this.PartyBlastService.adminlist(dto);
    }

    @Roles(UsersType.Admin)
    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Detail of partyblast buy by admin" })
    @Get("detail")
    details(@Query("id") id:string)
    {
        return this.PartyBlastService.partyDetails(id);
    }

    @ApiBearerAuth('authorization')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiOperation({ summary: "Detail of partyblast for vendor and customer" })
    @Get("party-list")
    listPartyBlast(@Query() dto:PartyListCustomerDto ) {
        return this.PartyBlastService.partyList(dto);
    }
    


}
