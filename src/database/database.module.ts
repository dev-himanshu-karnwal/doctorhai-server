import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: AppConfigService) => ({
        uri: config.databaseUri,
      }),
      inject: [AppConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
