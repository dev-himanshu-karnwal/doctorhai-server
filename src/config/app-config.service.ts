import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { MailProvider } from 'src/infra/mail/enums/mail-provider.enum';

/**
 * Typed app config service injectable anywhere (global).
 * Use property-style access: this.appConfig.databaseUri, this.appConfig.port, etc.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService) {}

  get databaseUri(): string {
    return (
      this.config.get<string>('database.uri') ??
      'mongodb://localhost:27017/doctorhai'
    );
  }

  get apiPrefix(): string {
    return this.config.get<string>('app.apiPrefix') ?? 'api/v1';
  }

  get corsOrigins(): string | string[] {
    const origins = this.config.get<string>('app.corsOrigins') ?? '*';
    if (origins === '*') return '*';
    return origins.split(',').map((o) => o.trim());
  }

  get port(): number {
    return this.config.get<number>('app.port') ?? 3000;
  }

  get nodeEnv(): string {
    return this.config.get<string>('app.nodeEnv') ?? 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv.toLowerCase().trim() === 'development';
  }

  get bcryptRounds(): number {
    return this.config.get<number>('auth.bcryptRounds') ?? 12;
  }

  get jwtSecret(): string {
    return (
      this.config.get<string>('jwt.secret') ??
      'change-me-in-production-use-long-random-string'
    );
  }

  get jwtCookieName(): string {
    return this.config.get<string>('jwt.cookieName') ?? 'access_token';
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>('jwt.expiresIn') ?? '15m';
  }

  get mailProvider(): MailProvider {
    return (
      this.config.get<MailProvider>('mail.provider') ?? MailProvider.NODEMAILER
    );
  }

  get mailDefaultFrom(): string {
    return (
      this.config.get<string>('mail.defaultFrom') ?? 'no-reply@doctorhai.local'
    );
  }

  get mailSmtpHost(): string {
    return this.config.get<string>('mail.smtpHost') ?? 'localhost';
  }

  get mailSmtpPort(): number {
    return this.config.get<number>('mail.smtpPort') ?? 1025;
  }

  get mailSmtpSecure(): boolean {
    return this.config.get<boolean>('mail.smtpSecure') ?? false;
  }

  get mailSmtpUser(): string | undefined {
    return this.config.get<string>('mail.smtpUser') ?? undefined;
  }

  get mailSmtpPass(): string | undefined {
    return this.config.get<string>('mail.smtpPass') ?? undefined;
  }

  /**
   * Generic get for any config key (e.g. app.get('database.uri')).
   */
  get<T = string>(path: string): T | undefined {
    return this.config.get<T>(path);
  }
}
