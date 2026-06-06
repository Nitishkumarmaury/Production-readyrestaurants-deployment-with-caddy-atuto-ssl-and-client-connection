import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AdminService } from './admin/admin.service';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadDto } from './admin/dto/admin.dto';
import { ContentPageService } from './content-page/content-page.service';
import { ConfigurationService } from './configuration/configuration.service';
import { app } from 'firebase-admin';
import { DbService } from './db/db.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly adminService: AdminService,
    private readonly dbService: DbService,
    private readonly pagesService: ContentPageService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dbService.create_tenant_connection(
        process.env.DB_URL,
        'ready-restaurant-dev',
      ),


    await Promise.all([
      
      this.adminService.BootStrapLanguage(),
      this.adminService.BootStrapAmenities(),
      this.adminService.BootStrapServices(),
      this.pagesService.bootstrap_pages(),
      this.configurationService.bootstrap_configuration(),
      this.appService.syncVehicleType(),
      this.appService.syncFoodCategory(),

      ...(process.env.ENVIROMENT !== 'live'
      ? [
          this.adminService.bootstrap_for_created_admin(),
          this.adminService.bootstrap_for_created_global_admin(),
        ]
      : []),
    ]);

  }

  @Post('image-upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      let appConfig = await this.configurationService.getConfiguration();
      if (!appConfig || !appConfig.bucket) {
        throw new Error('Bucket not found');
      }

      const bucketName = appConfig?.bucket?.bucket_name || '';
      const doEndpoint = appConfig?.bucket?.do_endpoint || '';

      const extension = file.originalname.slice(
        file.originalname.lastIndexOf('.'),
      );
      const newUniqueName = Date.now() + extension;

      const key = `${appConfig.bucket.folder}/${newUniqueName}`;

      const result = await this.appService.uploadImage(key, file, file.buffer);
      const imageName = result.Key.split('/').pop();
      return {
        message: 'Image uploaded successfully',
        key: imageName,
        image_url: `${doEndpoint}/${bucketName}/${appConfig.bucket.folder}/${imageName}`,
      };
    } catch (e) {
      console.log(e);
    }
  }

  @Post('csv-upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    const result = await this.appService.uploadCsv(file, file.buffer);
    return {
      message: 'Csv uploaded successfully',
      data: result,
    };
  }
}
