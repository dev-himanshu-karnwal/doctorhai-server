import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
}));
