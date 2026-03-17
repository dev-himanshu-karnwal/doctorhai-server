import { Module } from '@nestjs/common';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './services/global-search.service';
import { GLOBAL_SERVICE_TOKEN } from '../../common/constants';
import { DoctorProfilesModule } from '../doctor-profiles/doctor-profiles.module';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [DoctorProfilesModule, HospitalsModule],
  controllers: [GlobalSearchController],
  providers: [
    {
      provide: GLOBAL_SERVICE_TOKEN,
      useClass: GlobalSearchService,
    },
  ],
  exports: [GLOBAL_SERVICE_TOKEN],
})
export class GlobalSearchModule {}
