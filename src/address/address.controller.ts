import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { AddressService } from './address.service';

import { Roles } from 'src/auth/decorators/role.decorators';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { CustomerAddressDto } from './dto/address.dto';
import { UsersType } from 'src/auth/role/user.role';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';

@Controller('address')
@ApiTags('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  
  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary:"Customer add our address "})
  @Post('')
  AddAddress(@Body() body: CustomerAddressDto,@Request() req) {
    return this.addressService.AddAddress(body,req.payload.user_id);
  }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary:"Customer delete our address"})
  @Delete('/:id')
  delete_Address(@Param('id') id:string) {
    return this.addressService.DeleteAddress(id);
  }

  // @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary:"Customer get our address"})
  @Get('')
  get_Address(@Request() req) {

    return this.addressService.FindAllAddress(req);
  }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary:"Customer update our address"})
  @Put('/:id')
  UpdateAddress(@Param('id') id:string,@Body() body:CustomerAddressDto) {
    return this.addressService.UpdateAddress(id,body);
  }

  @Roles(UsersType.Customer)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard,RolesGuard)
  @ApiOperation({ summary:"Customer update our current address"})
  @Put('update-to-current/:id')
  UpdateCurrentAddress(@Param('id') id:string,@Request() req) {
    return this.addressService.UpdateCurrentAddress(id,req.payload.user_id);
  }
}
