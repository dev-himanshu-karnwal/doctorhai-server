import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from './config';
import { GlobalExceptionFilter } from './common/filters';
import {
  ApiResponseInterceptor,
  RequestIdInterceptor,
} from './common/interceptors';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(config.apiPrefix);
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new ApiResponseInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DoctorHai API')
    .setDescription('DoctorHai server API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port);
}

void bootstrap();
