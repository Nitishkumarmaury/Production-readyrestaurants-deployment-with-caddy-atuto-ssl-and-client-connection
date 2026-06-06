import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { DbService } from './db/db.service';

import { Readable } from 'stream';
import * as csv from 'csv-parser';

@Injectable()
export class AppService {
  private s3: AWS.S3;

  constructor(private readonly model: DbService) {}

  async configBucketDetails() {
    let appConfig = await this.model.appConfiguration.findOne().lean();

    const awsConfig = new AWS.Config({
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      region: appConfig.bucket.do_region,
      credentials: {
        accessKeyId: appConfig.bucket.do_access_key,
        secretAccessKey: appConfig.bucket.do_secret_access_key,
      },
    } as AWS.ConfigurationOptions);
    // Manually set the endpoint as it's not part of AWS.Config type definition
    (awsConfig as any).endpoint = appConfig.bucket.do_endpoint;
    this.s3 = new AWS.S3(awsConfig);
  }

  async uploadImage(key: string, file, fileBuffer: Buffer) {
    await this.configBucketDetails();

    let appConfig = await this.model.appConfiguration.findOne().lean();
    if (!appConfig || !appConfig.bucket) {
      throw new Error('Bucket not found');
    }

    const params: AWS.S3.Types.PutObjectRequest = {
      Bucket: appConfig.bucket.bucket_name,
      Key: key,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };
    return this.s3.upload(params).promise();
  }

  async uploadInvoice(file_name: string, fileBuffer) {
    await this.configBucketDetails();

    let appConfig = await this.model.appConfiguration.findOne().lean();
    if (!appConfig || !appConfig.bucket) {
      throw new Error('Bucket not found');
    }

    const params: AWS.S3.Types.PutObjectRequest = {
      Bucket: appConfig.bucket.bucket_name,
      Key: file_name,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      ACL: 'public-read', // Change if needed
    };
    return this.s3.upload(params).promise();
  }

  syncVehicleType = async () => {
    try {
      let vehicle = await this.model.vehicle.countDocuments();
      if (vehicle <= 0) {
        const payload = [
          { name: 'Electric Vehicle (EV)' },
          { name: 'Motorcycle / Scooty' },
        ];
        await this.model.vehicle.insertMany(payload);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  syncFoodCategory = async () => {
    try {
      let category = await this.model.category.countDocuments();
      if (category <= 0) {
        const payload: any = [
          {
            category_name: 'Burger',
            category_image:
              'a-flying-burger-with-all-the-layers-ai-generative-free-photo.jpg',
          },
          {
            category_name: 'Pasta',
            category_image: 'istockphoto-1325172440-612x612.jpg',
          },
          { category_name: 'Chicken', category_image: 'images (4).jpeg' },
          {
            category_name: 'Beverages',
            category_image: 'istockphoto-1366811978-612x612.jpg',
          },
          { category_name: 'Breakfast', category_image: 'download.jpg' },
          { category_name: 'Chinese', category_image: 'download (1).jpg' },
          {
            category_name: 'Desserts ',
            category_image:
              '360_F_301978652_O0aPwap1JaEVaAhj3mIlbqNnJGmRyCzC.jpg',
          },
          {
            category_name: 'Main Course ',
            category_image: 'istockphoto-1403973419-612x612.jpg',
          },
        ];

        await this.model.category.insertMany(payload);
        console.log('category sync successfully!');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  async uploadCsv(file, fileBuffer: Buffer) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(
        'Invalid file type. Only CSV files are allowed.',
      );
    }

    const records = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null); // Indicates end of stream

    try {
      const requiredFields = [
        'category',
        'name',
        'description',
        'quantity',
        'unit',
        'price',
      ];

      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csv())
          .on('data', (data) => records.push(data))
          .on('end', () => {
            if (!records || records.length === 0) {
              return reject(
                new BadRequestException(
                  'CSV file is empty or has no valid rows.',
                ),
              );
            }

            // Get headers from first row
            const headers = Object.keys(records[0]);

            // Check missing fields
            const missingFields = requiredFields.filter(
              (field) => !headers.includes(field),
            );

            if (missingFields.length > 0) {
              return reject(
                new BadRequestException(
                  `CSV is missing required fields: ${missingFields.join(', ')}`,
                ),
              );
            }

            // Optional: validate empty values in rows
            const invalidRows = records.filter((row, index) =>
              requiredFields.some((field) => !row[field]),
            );

            if (invalidRows.length > 0) {
              return reject(
                new BadRequestException(
                  'Some rows have missing required field values.',
                ),
              );
            }

            console.log('CSV data parsed:', records);
            resolve(records);
          })
          .on('error', (err) => {
            reject(new BadRequestException('Error parsing CSV file.'));
          });
      });

      // console.log(typeof records)

      // if(records.length <= 0){
      //   throw new BadRequestException('No data found in CSV file.');
      // }

      return records;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async uploadQRcode(fileBuffer: any) {
    await this.configBucketDetails();

    let appConfig = await this.model.appConfiguration.findOne().lean();
    if (!appConfig || !appConfig.bucket) {
      throw new Error('Bucket not found');
    }

    // remove base64 prefix
    const base64Data = fileBuffer.replace(/^data:image\/png;base64,/, '');

    // convert to buffer
    fileBuffer = Buffer.from(base64Data, 'base64');

    const newUniqueName = `${Date.now()}.png`;

    const file_name = `${appConfig.bucket.folder}/qrcodes/${newUniqueName}`;

    const params: AWS.S3.Types.PutObjectRequest = {
      Bucket: appConfig.bucket.bucket_name,
      Key: file_name,
      Body: fileBuffer,
      ContentEncoding: 'base64',
      ContentType: 'image/png',
      ACL: 'public-read',
    };

    let uploadResult : any = await this.s3.upload(params).promise();
    uploadResult["name"] = `qrcodes/${newUniqueName}`;

    return uploadResult;

  }
}
