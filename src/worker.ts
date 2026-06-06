import { NestFactory } from '@nestjs/core';
import { WorkModule } from './work/work.module';
import { BullModule } from '@nestjs/bull';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    WorkModule,

);

  console.log('Worker Server running...');
}
bootstrap();