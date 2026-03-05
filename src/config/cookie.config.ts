import { registerAs } from '@nestjs/config';

export const cookieConfig = registerAs('cookie', () => ({
  name: process.env.COOKIE_NAME ?? 'access_token',
  maxAge: parseInt(process.env.COOKIE_MAX_AGE ?? '1036800000', 10),
  secure: process.env.COOKIE_SECURE === 'true',
}));
