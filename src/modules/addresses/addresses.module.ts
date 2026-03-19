import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ADDRESS_REPOSITORY_TOKEN,
  ADDRESS_SERVICE_TOKEN,
} from '../../common/constants';
import { AddressSchema } from './schemas';
import { AddressesRepository } from './repositories';
import { AddressesService } from './services';
import { AddressesController } from './controllers/addresses.controller';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { DoctorProfilesModule } from '../doctor-profiles/doctor-profiles.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Address', schema: AddressSchema }]),
    forwardRef(() => HospitalsModule),
    forwardRef(() => DoctorProfilesModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [AddressesController],
  providers: [
    { provide: ADDRESS_REPOSITORY_TOKEN, useClass: AddressesRepository },
    { provide: ADDRESS_SERVICE_TOKEN, useClass: AddressesService },
  ],
  exports: [ADDRESS_SERVICE_TOKEN, ADDRESS_REPOSITORY_TOKEN],
})
export class AddressesModule {}
