import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import AppException from '../exceptions/app.exception';

type Exception = {
  response: Record<string, any>;
  status: number;
};

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: Exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.status;
    const message = exception.response.message as unknown;
    const code = exception.response.code as string;

    response.status(status).json({
      success: false,
      message,
      code,
    });
  }
}
