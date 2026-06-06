import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Request,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminDto, NotificationDto, SignInDto, UpdateTaxAmount } from './dto/admin.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import * as dto from './dto/admin.dto';
import { DecryptDataDto } from '../admin/dto/decrypt-data.dto';
import { UpdateSubAdminDto } from './dto/update-sub-admin.dto';
import { CreateSubAdminDto } from './dto/create-staff.dto';
import { StaffListDto } from './dto/staff-listing.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @ApiOperation({ summary: 'signin by admin' })
  @Post()
  create(@Body() signInDto: SignInDto, @Request() req) {
    return this.adminService.login(signInDto, req);
  }

  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Get('dashboard')
  async dashboard() {
    return await this.adminService.dashboard();
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Put('update-tax')
  async UpdateTax(@Request() req, @Body() body: UpdateTaxAmount) {
    return await this.adminService.UpdateTax(body, req.payload.user_id);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Get('tax-transaction-history')
  async TaxTransactionHistory(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.adminService.TaxTransactionHistory(page, limit);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Get('total-tax-detail')
  async taxDetail(@Request() req) {
    return await this.adminService.total_tax_amount(req.payload.user_id);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'sent notification' })
  @ApiBearerAuth('authorization')
  @Post("notifiation")
  async sent_notification(@Body() body: NotificationDto) {
    return await this.adminService.sent_notification(body);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'get clud notification' })
  @ApiBearerAuth('authorization')
  @Get("cloud-notifiation")
  async cloudNotification(@Query() body: dto.CloudNotificationListDto) {
    return await this.adminService.cloudNotification(body);
  }




  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'quick_picks' })
  @ApiBearerAuth('authorization')
  @Post("quick_picks")
  async add_restro_quick_picks(@Request() req, @Body() body: dto.pick_restro) {
    return await this.adminService.add_restro_quick_picks(req, body);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'quick_picks' })
  @ApiBearerAuth('authorization')
  @Get("quick_picks")
  async get_quick_picks_admin(@Request() req, @Query() body: dto.pick_restro_list) {
    return await this.adminService.get_quick_picks_admin(req, body);
  }

  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'quick_picks' })
  @ApiBearerAuth('authorization')
  @Delete("quick_picks/:restaurant_id")
  async remove_quick_picks_admin(@Request() req, @Param('restaurant_id') restaurant_id: string) {
    return await this.adminService.remove_quick_picks_admin(restaurant_id);
  }

  @Roles(UsersType.SubAdmin)
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Decrypt email or phone after verifying password' })
  @Post('decrypt-data')
  decryptData(@Body() body: DecryptDataDto, @Request() req) {
    return this.adminService.decryptData(body, req.payload, req)
  }

  @Post('add-staff')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add staff by Admin.' })
  @ApiBearerAuth('authorization')
  @ApiBody({ type: CreateSubAdminDto })
  async createSubAdmin(@Body() dto: CreateSubAdminDto) {
    try {
      return this.adminService.createSubAdmin(dto);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error?.message || 'Something went wrong while adding staff',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('update-staff/:id')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update staff by Admin.' })
  @ApiBearerAuth('authorization')
  async updateSubAdmin(@Param('id') id: string, @Body() dto: UpdateSubAdminDto) {
    return this.adminService.updateSubAdmin(id, dto);
  }

  @Delete('delete-staff/:id')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete staff by Admin.' })
  @ApiBearerAuth('authorization')
  async deleteSubAdmin(@Param('id') id: string) {
    return this.adminService.deleteSubAdmin(id);
  }

  @Get('staff-list')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get staff list by Admin.' })
  @ApiBearerAuth('authorization')
  async getAllStaffs(@Query() query: StaffListDto) {
    return this.adminService.getStaffList(query);
  }

  @Get('staff-detail/:id')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get staff detail by ID.' })
  @ApiBearerAuth('authorization')
  async getStaffDetail(@Param('id') id: string) {
    return this.adminService.getStaffDetail(id);
  }

  // PATCH: Block/Unblock staff by ID
  @Patch('block-unblock-staff/:id/:status')
  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Block or unblock staff by ID.' })
  @ApiParam({ name: 'id', required: true, description: 'Staff ID' })
  @ApiParam({ name: 'status', required: true, description: 'Boolean: true = block, false = unblock' })
  @ApiBearerAuth('authorization')
  async blockUnblockStaff(
    @Param('id') id: string,
    @Param('status') status: 'true' | 'false',
  ) {
    return this.adminService.blockUnblockStaff(id, status === 'true');
  }




  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'change password' })
  @ApiBearerAuth('authorization')
  @Put("change/password")
  async changePassword(@Body() dto: dto.ChangePasswordDto,@Request() req) {
    return await this.adminService.changePassword(dto ,req);
  }



  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'change password' })
  @ApiBearerAuth('authorization')
  @Put("update-profile")
  async updateProfile(@Body() dto: dto.UpdateOwnerDto,@Request() req) {
    return await this.adminService.updateProfile(dto ,req);
  }





  @Get("roles-list")
  async rolesList() {
    return await this.adminService.rolesList();
  }


  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'list of top users' })
  @ApiBearerAuth('authorization')
  @Get("top-users")
  async topUsers(@Query() dto: dto.TopUsersDto, @Request() req) {
    return await this.adminService.topUsers(req, dto);
  }


  @Roles(UsersType.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'db clear' })
  @ApiBearerAuth('authorization')
  @Get("db-clear")
  async dbClear() {
    return await this.adminService.dbClear();
  }

 

}
