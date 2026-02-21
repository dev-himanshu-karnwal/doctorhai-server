import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../classes/api-response.class';
import type { ApiResponseBody } from '../interfaces/api-response.interface';

/**
 * Wraps all successful controller responses in the standard API format.
 * Returned value is set as data.entity; use ApiResponse.success() in controller
 * for custom message, or return raw entity and it will be wrapped here.
 */
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseBody<unknown>> {
    return next.handle().pipe(
      map((value) => {
        if (
          value != null &&
          typeof value === 'object' &&
          'status' in value &&
          'data' in value
        ) {
          return value as ApiResponseBody<unknown>;
        }
        return ApiResponse.success(value ?? null, 'Success');
      }),
    );
  }
}
