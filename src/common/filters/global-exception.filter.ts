import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseStatus } from '../enums';
import type { ApiResponseBody } from '../interfaces';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private isMongoDuplicateKeyError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      'code' in exception &&
      (exception as { code: number }).code === 11000
    );
  }

  private getDuplicateKeyMessage(exception: unknown): string {
    const err = exception as {
      message?: string;
      keyValue?: Record<string, unknown>;
    };
    if (err.keyValue && typeof err.keyValue === 'object') {
      const fields = Object.keys(err.keyValue);
      if (fields.length > 0) {
        const fieldList = fields.join(', ');
        return `A record with this ${fieldList} already exists`;
      }
    }
    return 'A record with this value already exists';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (req as Request & { requestId?: string }).requestId ?? '';

    let status: number;
    let rawResponse: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      rawResponse = exception.getResponse();
    } else if (this.isMongoDuplicateKeyError(exception)) {
      status = HttpStatus.CONFLICT;
      rawResponse = this.getDuplicateKeyMessage(exception);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      rawResponse = 'Internal server error';
    }

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
