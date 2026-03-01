import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { DoctorProfilesModule } from './modules/doctor-profiles/doctor-profiles.module';
import { DoctorStatusesModule } from './modules/doctor-statuses/doctor-statuses.module';
import { MailModule } from './infra/mail/mail.module';
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    MailModule,
    AuthModule,
    AddressesModule,
    HospitalsModule,
    DoctorProfilesModule,
    DoctorStatusesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
