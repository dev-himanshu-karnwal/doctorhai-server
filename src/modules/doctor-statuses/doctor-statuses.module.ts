import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DOCTOR_STATUS_REPOSITORY_TOKEN,
  DOCTOR_STATUS_SERVICE_TOKEN,
} from '../../common/constants';
import { AuthModule } from '../auth/auth.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { DoctorProfilesModule } from '../doctor-profiles/doctor-profiles.module';
import { DoctorStatusSchema } from './schemas/doctor-status.schema';
import { DoctorStatusesController } from './controllers/doctor-statuses.controller';
import { DoctorStatusesRepository } from './repositories/doctor-statuses.repository';
import { DoctorStatusesService } from './services/doctor-statuses.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DoctorStatus', schema: DoctorStatusSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => HospitalsModule),
    forwardRef(() => DoctorProfilesModule),
  ],
  controllers: [DoctorStatusesController],
  providers: [
    {
      provide: DOCTOR_STATUS_REPOSITORY_TOKEN,
      useClass: DoctorStatusesRepository,
    },
    {
      provide: DOCTOR_STATUS_SERVICE_TOKEN,
      useClass: DoctorStatusesService,
    },
  ],
  exports: [DOCTOR_STATUS_REPOSITORY_TOKEN, DOCTOR_STATUS_SERVICE_TOKEN],
})
export class DoctorStatusesModule {}
