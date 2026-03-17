import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  THROTTLE_GLOBAL_LIMIT,
  THROTTLE_GLOBAL_TTL_MS,
} from './common/constants';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './health';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { DoctorProfilesModule } from './modules/doctor-profiles/doctor-profiles.module';
import { DoctorStatusesModule } from './modules/doctor-statuses/doctor-statuses.module';
import { GlobalSearchModule } from './modules/global/global-search.module';
import { MailModule } from './infra/mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      { ttl: THROTTLE_GLOBAL_TTL_MS, limit: THROTTLE_GLOBAL_LIMIT },
    ]),
    DatabaseModule,
    HealthModule,
    MailModule,
    AuthModule,
    AccountsModule,
    AddressesModule,
    HospitalsModule,
    DoctorProfilesModule,
    DoctorStatusesModule,
    GlobalSearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
