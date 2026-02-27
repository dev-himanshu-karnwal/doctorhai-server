import { ApiResponseStatus } from '../enums';

/** Data is a record with dynamic keys: { user }, { hospital }, { hospitals }, etc. */
export type ApiResponseData<T = unknown> = Record<string, T>;

export interface ApiResponseBody<T = unknown> {
  status: ApiResponseStatus;
  message: string;
  data: ApiResponseData<T>;
  error?: unknown;
}

/** Wrapper returned by controllers to specify a custom data key instead of "entity" */
export interface DataKeyWrapper<K extends string = string> {
  dataKey: K;
  value: unknown;
}
