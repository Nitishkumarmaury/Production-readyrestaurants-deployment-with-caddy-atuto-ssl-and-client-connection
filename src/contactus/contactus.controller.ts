import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ContactusService } from './contactus.service';
import { CreateContactusDto, findAllDto } from './dto/create-contactus.dto';
import { UpdateContactusDto } from './dto/update-contactus.dto';
import { UsersType } from 'src/auth/role/user.role';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';

@Controller('contactus')
@ApiTags('contactUs')
export class ContactusController {
  constructor(
    private readonly contactusService: ContactusService,
    private readonly jwtService: JwtService,
  ) {}

  // @UseGuards(AuthGuard)
  // @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'contact us' })
  @Post()
  async create(@Body() createContactusDto: CreateContactusDto, @Request() req) {
    let tok = req.headers.authorization?.split(' ') ?? null
    let user: any
    if (tok !== null) {
      user = await this.jwtService?.verifyAsync(tok[1], {
        secret: jwtConstants.secret,
      });
    }
    return this.contactusService.create(createContactusDto, user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'contact us' })
  @Get()
  findAll(@Query() body: findAllDto) {
    return this.contactusService.findAll(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactusService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactusDto: UpdateContactusDto,
  ) {
    return this.contactusService.update(id, updateContactusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactusService.remove(id);
  }
}
