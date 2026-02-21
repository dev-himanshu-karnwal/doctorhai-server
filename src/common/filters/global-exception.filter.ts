import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseStatus } from '../enums/api-response-status.enum';
import type { ApiResponseBody } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (req as Request & { requestId?: string }).requestId ?? '';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof rawResponse === 'object' &&
      rawResponse !== null &&
      'message' in rawResponse
        ? (rawResponse as { message: string | string[] }).message
        : typeof rawResponse === 'string'
          ? rawResponse
          : 'Internal server error';

    const messageStr = Array.isArray(message) ? message.join(', ') : message;

    const errorPayload =
      typeof rawResponse === 'object' && rawResponse !== null
        ? rawResponse
        : undefined;

    this.logger.error(
      `${req.method} ${req.url} ${status} - ${messageStr}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const isClientError = status >= 400 && status < 500;
    const body: ApiResponseBody<null> = {
      status: isClientError ? ApiResponseStatus.FAIL : ApiResponseStatus.ERROR,
      message: messageStr,
      data: { entity: null },
      error: {
        ...(errorPayload &&
        typeof errorPayload === 'object' &&
        'error' in errorPayload
          ? { type: (errorPayload as { error: string }).error }
          : {}),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(status).json(body);
  }
}
