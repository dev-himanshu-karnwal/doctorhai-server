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
import { HospitalsController } from './controllers/hospitals.controller';
import { HospitalPublicController } from './controllers/hospitals-public.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Hospital', schema: HospitalSchema }]),
    AddressesModule,
  ],
  controllers: [HospitalsController, HospitalPublicController],
  providers: [
    { provide: HOSPITAL_REPOSITORY_TOKEN, useClass: HospitalsRepository },
    { provide: HOSPITAL_SERVICE_TOKEN, useClass: HospitalsService },
  ],
  exports: [HOSPITAL_SERVICE_TOKEN],
})
export class HospitalsModule {}
