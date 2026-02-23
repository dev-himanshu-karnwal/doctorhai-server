import { Injectable, Logger, Inject } from '@nestjs/common';
import { HOSPITAL_REPOSITORY_TOKEN } from '../../../common/constants';
import type { IHospitalRepository, IHospitalService } from '../interfaces';
import type { CreateHospitalInput } from '../interfaces';

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
  ): Promise<Awaited<ReturnType<IHospitalService['create']>>> {
    this.logger.debug(`Creating hospital for account: ${data.accountId}`);
    return this.hospitalRepo.create(data);
  }
}
