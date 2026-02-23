import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret:
    process.env.JWT_SECRET ?? 'change-me-in-production-use-long-random-string',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
}));
