import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs'
import * as bodyParser from 'body-parser';
import { LoggerMiddleware } from './middlewares/request-logger.middleware';
import { ExceptionService } from './exception/exception.service';
import { AllExceptionsFilter } from './exception/all-exceptions.filter';
import * as basicAuth from 'express-basic-auth';
import { TenantLoggerMiddleware } from './middlewares/tenant-logger.middleware';

const SSL = process.env.SSL || false
const PORT = process.env.LOCAL_PORT;
const CERT = process.env.SSL_CERT;
const PRIV_KEY = process.env.SSL_PRIV_KEY;

async function bootstrap() {

  let httpsOptions = {}

  if (SSL == "true") {
    httpsOptions = {
      key: fs.readFileSync(PRIV_KEY),
      cert: fs.readFileSync(CERT),
    };
  }

  const app = SSL == "true" ? await NestFactory.create(AppModule, { httpsOptions }) : await NestFactory.create(AppModule);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(LoggerMiddleware);

  if (process.env.ENVIROMENT !== 'local') {
    const docsUser = process.env.API_DOCS_USER;
    const docsPassword = process.env.API_DOCS_PASSWORD;

    if (!docsUser || !docsPassword) {
      throw new Error('API_DOCS_USER and API_DOCS_PASSWORD are required when ENVIROMENT is not local.');
    }

    app.use(
      ['/api'], // Protect both UI & JSON routes
      basicAuth({
        users: { [docsUser]: docsPassword },
        challenge: true,
      }),
    );
  }



  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('HF ReadyDeliveries ')
    .setDescription('')
    .addBearerAuth({ type: 'http', name: 'token', in: 'header' }, 'authorization')
    .addServer(`http://localhost:${process.env.PORT}`, 'local server')
    .addServer(`http://192.168.0.138:${process.env.PORT}`, 'local server')
    .addServer(`https://dev.readyrestaurants.api.henceforthsolutions.com`, 'dev server')
    .addServer("https://readyrestaurants.api.henceforthsolutions.com", 'Live Server')
    .setVersion('1.0')
    .addGlobalParameters({
      name: 'x-tenant-id',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        example: 'ready-delivery',
      },
    })
    .addTag('Apis')
    .build();


  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,

    }
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document, customOptions);
  console.log("port===>>>>>>", process.env.PORT);


  const errorLogService = app.get(ExceptionService);
  app.useGlobalFilters(new AllExceptionsFilter(errorLogService));

  await app.listen(process.env.PORT);
}
bootstrap();


