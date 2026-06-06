import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { SosSystemService } from './sos-system.service';
import { CreateSosSystemDto } from './dto/create-sos-system.dto';
import { UpdateSosSystemDto } from './dto/update-sos-system.dto';

@Controller('sos-system')
@ApiTags('sos-system')
export class SosSystemController {
  constructor(private readonly sosSystemService: SosSystemService) { }

  @Post('capture-contacts')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Add SOS contact for driver' })
  @ApiBody({ type: CreateSosSystemDto })
  async addContact(@Body() dto: CreateSosSystemDto, @Request() req) {
    return this.sosSystemService.addContact(req.user._id, dto);
  }

  @Get('get-contact-list')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Get SOS contacts for driver' })
  async getContacts(@Request() req) {
    return this.sosSystemService.getContacts(req.user._id);
  }

  @Put(':contactId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Update SOS contact by ID' })
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() dto: UpdateSosSystemDto,
    @Request() req,
  ) {
    return this.sosSystemService.updateContact(req.user._id, contactId, dto);
  }

  @Delete(':contactId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Delete SOS contact by ID' })
  async deleteContact(@Param('contactId') contactId: string, @Request() req) {
    return this.sosSystemService.deleteContact(req.user._id, contactId);
  }
}
