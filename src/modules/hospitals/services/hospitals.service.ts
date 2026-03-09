import { Injectable, Logger, Inject } from '@nestjs/common';
import { HOSPITAL_REPOSITORY_TOKEN } from '../../../common/constants';
import { generateSlugFromName } from '../../../common/utils';
import type {
  IHospitalRepository,
  IHospitalService,
  HospitalsQuery,
} from '../interfaces';
import type { CreateHospitalInput } from '../interfaces';
import { HospitalEntity } from '../entities';
import { HospitalStats } from '../dto/hospital_stats.dto';
import type { PaginatedHospitals } from '../interfaces/hospital-service.interface';
import type { ClientSession } from 'mongoose';

@Injectable()
export class HospitalsService implements IHospitalService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(
    @Inject(HOSPITAL_REPOSITORY_TOKEN)
    private readonly hospitalRepo: IHospitalRepository,
  ) {}

  async findByAccountId(accountId: string): Promise<HospitalEntity | null> {
    this.logger.debug(`Finding hospital by accountId: ${accountId}`);
    return await this.hospitalRepo.findByAccountId(accountId);
  }

  async updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<HospitalEntity | null> {
    this.logger.debug(`Updating hospital email by accountId: ${accountId}`);
    return await this.hospitalRepo.updateEmailByAccountId(accountId, email);
  }

  async create(
    data: CreateHospitalInput,
    session?: ClientSession,
  ): Promise<HospitalEntity> {
    this.logger.debug(`Creating hospital for account: ${data.accountId}`);
    return await this.hospitalRepo.create(data, session);
  }

  async getHospitals(query: HospitalsQuery): Promise<PaginatedHospitals> {
    this.logger.debug(
      `Fetching hospitals with query: ${JSON.stringify(query)}`,
    );
    return await this.hospitalRepo.findHospitals(query);
  }

  async update(
    id: string,
    data: Partial<Omit<CreateHospitalInput, 'accountId'>>,
  ): Promise<HospitalEntity | null> {
    if (data.name) {
      data.slug = generateSlugFromName(data.name);
    }

    return await this.hospitalRepo.update(id, data);
  }

  async findById(id: string): Promise<HospitalEntity | null> {
    this.logger.debug(`Finding hospital by id: ${id}`);
    return await this.hospitalRepo.findById(id);
  }

  async incrementHospitalViewCount(id: string): Promise<void> {
    this.logger.debug(`Incrementing view count for hospital: ${id}`);
    await this.hospitalRepo.incrementViewCount(id);
  }

  async getStats(): Promise<HospitalStats> {
    this.logger.debug('Fetching hospital statistics');
    return await this.hospitalRepo.getStats();
  }
}
