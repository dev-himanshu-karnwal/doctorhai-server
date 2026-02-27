import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  provider: process.env.MAIL_PROVIDER ?? 'nodemailer',
  defaultFrom: process.env.MAIL_FROM ?? 'no-reply@doctorhai.local',
  smtpHost: process.env.MAIL_SMTP_HOST ?? 'localhost',
  smtpPort: parseInt(process.env.MAIL_SMTP_PORT ?? '1025', 10),
  smtpSecure: process.env.MAIL_SMTP_SECURE === 'true',
  smtpUser: process.env.MAIL_SMTP_USER ?? '',
  smtpPass: process.env.MAIL_SMTP_PASS ?? '',
}));
