import { ApiResponseStatus } from '../enums';

export interface ApiResponseData<T = unknown> {
  entity: T;
}

export interface ApiResponseBody<T = unknown> {
  status: ApiResponseStatus;
  message: string;
  data: ApiResponseData<T>;
  error?: unknown;
}
