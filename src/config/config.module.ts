import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { mailConfig } from './mail.config';
import { AppConfigService } from './app-config.service';
import { envValidationSchema } from './env.validation';

const nodeEnv = process.env.NODE_ENV || 'development';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${nodeEnv}`],
      load: [appConfig, authConfig, databaseConfig, jwtConfig, mailConfig],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Joi schema from env.validation
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
