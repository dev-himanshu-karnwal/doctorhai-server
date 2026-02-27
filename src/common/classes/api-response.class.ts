import { ApiResponseStatus } from '../enums';
import type { ApiResponseBody, DataKeyWrapper } from '../interfaces';

/** Check if value is a { dataKey, value } wrapper from controllers */
export function isDataKeyWrapper(obj: unknown): obj is DataKeyWrapper {
  return (
    obj != null &&
    typeof obj === 'object' &&
    'dataKey' in obj &&
    'value' in obj &&
    typeof (obj as DataKeyWrapper).dataKey === 'string'
  );
}

export class ApiResponse {
  /**
   * Build success response with optional dynamic data key.
   * @param entity - The response payload
   * @param message - Success message
   * @param dataKey - Key under data (e.g. 'user', 'hospital', 'hospitals'). Defaults to 'entity'
   */
  static success<T>(
    entity: T,
    message = 'Success',
    dataKey = 'entity',
  ): ApiResponseBody<T> {
    return {
      status: ApiResponseStatus.SUCCESS,
      message,
      data: { [dataKey]: entity } as Record<string, T>,
    };
  }

  /**
   * Helper for controllers: return this to use a dynamic key instead of "entity".
   * Example: return withDataKey('user', userDto) → data: { user: userDto }
   */
  static withDataKey<K extends string>(
    dataKey: K,
    value: unknown,
  ): DataKeyWrapper<K> {
    return { dataKey, value };
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
