import * as Joi from 'joi';

/**
 * Schema for required env vars. App will NOT start if any required var is missing or invalid.
 * Optional vars have defaults; required vars must be set in .env (or environment).
 */
export const envValidationSchema = Joi.object({
  // --- Required (no safe default) ---
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  MONGODB_URI: Joi.string().required().messages({
    'any.required': 'MONGODB_URI is required. Set it in .env or environment.',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is required. Set it in .env or environment.',
    'string.min': 'JWT_SECRET must be at least 32 characters.',
  }),

  // --- Optional (with defaults) ---
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('*'),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_COOKIE_NAME: Joi.string().default('access_token'),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  MAIL_PROVIDER: Joi.string().default('nodemailer'),
  MAIL_FROM: Joi.string().allow('').default('no-reply@doctorhai.local'),
  MAIL_SMTP_HOST: Joi.string().default('localhost'),
  MAIL_SMTP_PORT: Joi.number().integer().min(1).max(65535).default(1025),
  MAIL_SMTP_SECURE: Joi.string().valid('true', 'false', '').default('false'),
  MAIL_SMTP_USER: Joi.string().allow('').default(''),
  MAIL_SMTP_PASS: Joi.string().allow('').default(''),
});
