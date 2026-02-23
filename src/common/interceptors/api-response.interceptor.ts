import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, isDataKeyWrapper } from '../classes';
import type { ApiResponseBody } from '../interfaces';

/**
 * Wraps all successful controller responses in the standard API format.
 * - Return ApiResponse.withDataKey('user', userDto) for dynamic keys (user, hospital, hospitals, etc.)
 * - Return raw entity for default data.entity
 * - Return full ApiResponseBody for custom responses
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
        if (isDataKeyWrapper(value)) {
          return ApiResponse.success(
            value.value ?? null,
            'Success',
            value.dataKey,
          );
        }
        return ApiResponse.success(value ?? null, 'Success');
      }),
    );
  }
}
