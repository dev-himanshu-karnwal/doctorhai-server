import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '../config';

import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
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
