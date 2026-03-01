/**
 * OTP generation and validation limits.
 */
/** OTP validity duration in milliseconds (e.g. 10 minutes). */
export const OTP_EXPIRY_MS = 10 * 60 * 1000;

/** Max verification attempts per OTP before it is considered exhausted. */
export const OTP_MAX_ATTEMPTS = 5;
