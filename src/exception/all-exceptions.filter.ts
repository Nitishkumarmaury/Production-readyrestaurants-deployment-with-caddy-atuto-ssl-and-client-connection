import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DbService } from 'src/db/db.service';
import { ExceptionService } from './exception.service';

@Catch() // Catch every exception
export class AllExceptionsFilter implements ExceptionFilter {


    constructor(private readonly ExceptionService: ExceptionService) {}

    

  async catch(exception: unknown, host: ArgumentsHost) {
    
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      
      message =
        typeof res === 'string'
          ? res
          : (res as any).message || (res as any).error || (res as any).error_description ||  (res as any).error_code || message;




    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorString = exception instanceof Error ? exception.stack || exception.message : String(exception);
    console.log("Error ==>>", errorString);
    await this.ExceptionService.create(request.url, errorString);

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message,
      error_code : message,
      error_description : message

    });


  }
}
