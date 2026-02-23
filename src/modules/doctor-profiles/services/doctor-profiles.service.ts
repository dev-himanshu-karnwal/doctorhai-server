import { Injectable, Logger, Inject } from '@nestjs/common';
import { DOCTOR_PROFILE_REPOSITORY_TOKEN } from '../../../common/constants';
import type { ClientSession } from 'mongoose';
import type {
  IDoctorProfileRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
} from '../interfaces';

@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
  ) {}

  async findByAccountId(
    accountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['findByAccountId']>>> {
    this.logger.debug(`Finding doctor profile by accountId: ${accountId}`);
    return this.doctorProfileRepo.findByAccountId(accountId);
  }

  async findByEmailAndHospitalId(
    email: string,
    hospitalId: string | null,
  ): Promise<
    Awaited<ReturnType<IDoctorProfileService['findByEmailAndHospitalId']>>
  > {
    this.logger.debug(
      `Finding doctor profile by email and hospitalId: ${email}, ${hospitalId ?? 'individual'}`,
    );
    return this.doctorProfileRepo.findByEmailAndHospitalId(email, hospitalId);
  }

  async create(
    data: CreateDoctorProfileData,
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['create']>>> {
    this.logger.debug(`Creating doctor profile for account: ${data.accountId}`);
    return this.doctorProfileRepo.create(data, session);
  }
}
