import { Injectable, Logger, Inject } from '@nestjs/common';
import { HOSPITAL_REPOSITORY_TOKEN } from '../../../common/constants';
import type {
  IHospitalRepository,
  IHospitalService,
  HospitalsQuery,
} from '../interfaces';
import type { CreateHospitalInput } from '../interfaces';
import type { ClientSession } from 'mongoose';

@Injectable()
export class HospitalsService implements IHospitalService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(
    @Inject(HOSPITAL_REPOSITORY_TOKEN)
    private readonly hospitalRepo: IHospitalRepository,
  ) {}

  async findByAccountId(
    accountId: string,
  ): Promise<Awaited<ReturnType<IHospitalService['findByAccountId']>>> {
    this.logger.debug(`Finding hospital by accountId: ${accountId}`);
    return this.hospitalRepo.findByAccountId(accountId);
  }

  async create(
    data: CreateHospitalInput,
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IHospitalService['create']>>> {
    this.logger.debug(`Creating hospital for account: ${data.accountId}`);
    return this.hospitalRepo.create(data, session);
  }

  async getHospitals(
    query: HospitalsQuery,
  ): Promise<Awaited<ReturnType<IHospitalService['getHospitals']>>> {
    this.logger.debug(
      `Fetching hospitals with query: ${JSON.stringify(query)}`,
    );
    return this.hospitalRepo.findHospitals(query);
  }
}
