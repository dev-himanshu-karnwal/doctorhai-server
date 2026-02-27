import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
} from '../../common/constants';
import { AddressesModule } from '../addresses';
import { AuthModule } from '../auth/auth.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { DoctorProfileSchema } from './schemas';
import { DoctorProfilesController } from './controllers/doctor-profiles.controller';
import { DoctorProfilesRepository } from './repositories';
import { DoctorProfilesService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DoctorProfile', schema: DoctorProfileSchema },
    ]),
    AddressesModule,
    forwardRef(() => AuthModule),
    forwardRef(() => HospitalsModule),
  ],
  controllers: [DoctorProfilesController],
  providers: [
    {
      provide: DOCTOR_PROFILE_REPOSITORY_TOKEN,
      useClass: DoctorProfilesRepository,
    },
    { provide: DOCTOR_PROFILE_SERVICE_TOKEN, useClass: DoctorProfilesService },
  ],
  exports: [DOCTOR_PROFILE_SERVICE_TOKEN],
})
export class DoctorProfilesModule {}
