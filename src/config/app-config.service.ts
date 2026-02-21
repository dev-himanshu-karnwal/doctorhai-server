import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

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
      'mongodb://localhost:27017/doctor-status'
    );
  }

  get apiPrefix(): string {
    return this.config.get<string>('app.apiPrefix') ?? 'api/v1';
  }

  get port(): number {
    return this.config.get<number>('app.port') ?? 3000;
  }

  get nodeEnv(): string {
    return this.config.get<string>('app.nodeEnv') ?? 'development';
  }

  /**
   * Generic get for any config key (e.g. app.get('database.uri')).
   */
  get<T = string>(path: string): T | undefined {
    return this.config.get<T>(path);
  }
}
