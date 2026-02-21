import { ApiResponseStatus } from '../enums/api-response-status.enum';
import type {
  ApiResponseBody,
  ApiResponseData,
} from '../interfaces/api-response.interface';

export class ApiResponse {
  static success<T>(entity: T, message = 'Success'): ApiResponseBody<T> {
    return {
      status: ApiResponseStatus.SUCCESS,
      message,
      data: { entity },
    };
  }

  static error(message: string, error?: unknown): ApiResponseBody<null> {
    return {
      status: ApiResponseStatus.ERROR,
      message,
      data: { entity: null },
      ...(error !== undefined && { error }),
    };
  }

  static fail(message: string, error?: unknown): ApiResponseBody<null> {
    return {
      status: ApiResponseStatus.FAIL,
      message,
      data: { entity: null },
      ...(error !== undefined && { error }),
    };
  }
}
