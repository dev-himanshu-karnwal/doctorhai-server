import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountCreationService } from '../../auth/interfaces/account-creation-service.interface';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { ClientSession, Connection } from 'mongoose';
import type {
  IDoctorProfileRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';

@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @InjectConnection()
    private readonly connection: Connection,
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

  async createByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['createByHospital']>>> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      let hospitalId: string | null = null;
      const email = dto.email.toLowerCase().trim();

      const hospital =
        await this.hospitalService.findByAccountId(createdByAccountId);
      if (hospital) {
        hospitalId = hospital.id;
      } else {
        const creatorDoctor =
          await this.doctorProfileRepo.findByAccountId(createdByAccountId);
        hospitalId = creatorDoctor?.hospitalId ?? null;
      }

      if (
        await this.doctorProfileRepo.findByEmailAndHospitalId(email, hospitalId)
      ) {
        throw new BusinessRuleViolationException(
          `Email '${email}' is already used for a doctor profile at this hospital`,
        );
      }

      const account = await this.accountCreationService.createUsernameAccount(
        dto.username,
        email,
        dto.password,
        'doctor',
        session,
      );

      const doctor = await this.doctorProfileRepo.create(
        {
          fullName: dto.fullName.trim(),
          designation: null,
          specialization: null,
          phone: dto.phone,
          email,
          addressId: null,
          accountId: account.id,
          slug: generateSlugFromName(dto.fullName.trim()),
          bio: null,
          profilePhotoUrl: null,
          createdBy: createdByAccountId,
          hospitalId,
        },
        session,
      );

      await session.commitTransaction();

      this.logger.log(
        `Hospital created doctor account ${account.id} (username:${dto.username})`,
      );

      return doctor;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  getDoctors(query: DoctorsQuery): Promise<PaginatedDoctorProfiles> {
    this.logger.debug(`Listing doctors with query: ${JSON.stringify(query)}`);
    return this.doctorProfileRepo.findDoctors(query);
  }
}
