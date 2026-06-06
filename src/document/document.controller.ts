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
import { DocumentService } from './document.service';
import { CreateDocumentDto, FilterDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { ApproveRejectDocumentsDto, DocumentExpiryDateDto, GetUploadedDocumentsDto, SubmitDocumentDto, SubmitDocumentsDto } from './dto/submit-document.dto';

@Controller('document')
@ApiTags('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Create a new dynamic document form (for restaurant or driver)' })
  @Post('create')
  async create(@Body() dto: CreateDocumentDto) {
    return await this.documentService.create(dto);
  }

  @ApiOperation({ summary: 'Get list of documents filtered by type (restaurant or driver)' })
  @Get('list')
  async getDocuments(@Query() filterDto: FilterDocumentDto) {
    return await this.documentService.getDocuments(filterDto);
  }

  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document field by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Document field MongoDB _id' })
  async delete(@Param('id') id: string) {
    return await this.documentService.delete(id);
  }



  // @Roles(UsersType.Driver, UsersType.Vendor)
  // @UseGuards(AuthGuard, RolesGuard)
  // @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Submit multiple documents for driver or restaurant' })
  @Post('submit')
  async submitDocument(@Body() dto: SubmitDocumentsDto) {

    return await this.documentService.submitDocuments(dto);
  }

  // @Roles(UsersType.Admin, UsersType.SubAdmin)
  // @UseGuards(AuthGuard, RolesGuard)
  // @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Get uploaded documents for driver or restaurant' })
  @Get('uploaded-documents')
  async getUploadedDocuments(@Query() query: GetUploadedDocumentsDto) {
    return await this.documentService.getUploadedDocuments(query);
  }



  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'add document expiry date' })
  @Put('document-expiry')
  async addDocumentExpiryDate(@Body() dto: DocumentExpiryDateDto) {
    return await this.documentService.addDocumentExpiryDate(dto);
  }




  
  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Put(':id')
  @ApiOperation({ summary: 'update a document field by ID' })
  async update(@Param('id') id: string, @Body() dto : UpdateDocumentDto) {
    return await this.documentService.update(id, dto);
  }


  @Roles(UsersType.Admin, UsersType.SubAdmin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('authorization')
  @Get(':id')
  @ApiOperation({ summary: 'view a document field by ID' })
  async view(@Param('id') id: string) {
    return await this.documentService.view(id);
  }

  



}
