import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from '../auth/schemas';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
} from '../../common/constants';
import { AccountRepository } from './repositories';
import { AccountsService } from './services';
import { AccountsController } from './controllers/accounts.controller';
import { DoctorProfilesModule } from '../doctor-profiles/doctor-profiles.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { AddressesModule } from '../addresses/addresses.module';
import { DoctorStatusesModule } from '../doctor-statuses/doctor-statuses.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Account', schema: AccountSchema }]),
    forwardRef(() => DoctorProfilesModule),
    forwardRef(() => HospitalsModule),
    forwardRef(() => AddressesModule),
    DoctorStatusesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AccountsController],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY_TOKEN,
      useClass: AccountRepository,
    },
    {
      provide: ACCOUNT_SERVICE_TOKEN,
      useClass: AccountsService,
    },
  ],
  exports: [ACCOUNT_SERVICE_TOKEN],
})
export class AccountsModule {}
