/**
 * Throttle limits and TTLs (ms) for rate limiting.
 * Centralized for consistent tuning and reuse.
 */
const ONE_MINUTE_MS = 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

/** Global API throttle: requests per window */
export const THROTTLE_GLOBAL_TTL_MS = ONE_MINUTE_MS;
export const THROTTLE_GLOBAL_LIMIT = 100;

/** Auth: login / register – strict per-IP */
export const THROTTLE_AUTH_LOGIN_TTL_MS = ONE_MINUTE_MS;
export const THROTTLE_AUTH_LOGIN_LIMIT = 5;

/** Auth: check-username (slightly higher for UX) */
export const THROTTLE_AUTH_CHECK_USERNAME_TTL_MS = ONE_MINUTE_MS;
export const THROTTLE_AUTH_CHECK_USERNAME_LIMIT = 10;

/** Auth: forgot-password flow – longer window, fewer requests */
export const THROTTLE_AUTH_FORGOT_PASSWORD_TTL_MS = TEN_MINUTES_MS;
export const THROTTLE_AUTH_FORGOT_PASSWORD_REQUEST_LIMIT = 3;
export const THROTTLE_AUTH_FORGOT_PASSWORD_VERIFY_LIMIT = 5;

/** Min time between password-reset requests per email (ms). Used in PasswordResetService. */
export const PASSWORD_RESET_REQUEST_WINDOW_MS = ONE_MINUTE_MS;
