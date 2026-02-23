import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HOSPITAL_REPOSITORY_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../common/constants';
import { AddressesModule } from '../addresses';
import { HospitalSchema } from './schemas';
import { HospitalsRepository } from './repositories';
import { HospitalsService } from './services';
import { HospitalRegistrationListener } from './listeners/hospital-registration.listener';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Hospital', schema: HospitalSchema }]),
    AddressesModule,
  ],
  controllers: [],
  providers: [
    { provide: HOSPITAL_REPOSITORY_TOKEN, useClass: HospitalsRepository },
    { provide: HOSPITAL_SERVICE_TOKEN, useClass: HospitalsService },
    HospitalRegistrationListener,
  ],
  exports: [HOSPITAL_SERVICE_TOKEN],
})
export class HospitalsModule {}
