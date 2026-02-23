import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, UsersModule],
})
export class AppModule {}
