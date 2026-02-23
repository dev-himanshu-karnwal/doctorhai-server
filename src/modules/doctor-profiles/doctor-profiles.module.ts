import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
} from '../../common/constants';
import { AddressesModule } from '../addresses';
import { DoctorProfileSchema } from './schemas';
import { DoctorProfilesRepository } from './repositories';
import { DoctorProfilesService } from './services';
import { DoctorRegistrationListener } from './listeners/doctor-registration.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DoctorProfile', schema: DoctorProfileSchema },
    ]),
    AddressesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: DOCTOR_PROFILE_REPOSITORY_TOKEN,
      useClass: DoctorProfilesRepository,
    },
    { provide: DOCTOR_PROFILE_SERVICE_TOKEN, useClass: DoctorProfilesService },
    DoctorRegistrationListener,
  ],
  exports: [DOCTOR_PROFILE_SERVICE_TOKEN],
})
export class DoctorProfilesModule {}
