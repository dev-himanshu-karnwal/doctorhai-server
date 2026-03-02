import { Module, forwardRef, type Provider } from '@nestjs/common';
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
import { DoctorProfilesRepository } from './repositories/doctor-profiles.repository';
import { DoctorProfilesService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DoctorProfile', schema: DoctorProfileSchema },
    ]),
    AddressesModule,
    HospitalsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [DoctorProfilesController],
  providers: [
    {
      provide: DOCTOR_PROFILE_REPOSITORY_TOKEN,
      useClass: DoctorProfilesRepository,
    } as Provider,
    {
      provide: DOCTOR_PROFILE_SERVICE_TOKEN,
      useClass: DoctorProfilesService,
    } as Provider,
  ],
  exports: [DOCTOR_PROFILE_SERVICE_TOKEN, DOCTOR_PROFILE_REPOSITORY_TOKEN],
})
export class DoctorProfilesModule {}
