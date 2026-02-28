import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { AvailabilityStatus } from '../enums/availability-status.enum';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
  DOCTOR_STATUS_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountCreationService } from '../../auth/interfaces/account-creation-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { ClientSession, Connection } from 'mongoose';
import type {
  IDoctorProfileRepository,
  IDoctorStatusRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
  CreateDoctorStatusInput,
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN)
    private readonly doctorStatusRepo: IDoctorStatusRepository,
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
    // Determine hospitalId from the creator's account:
    // - If creator is a hospital account, use that hospital's id
    // - If creator is a doctor account linked to a hospital, use that hospitalId
    // - Otherwise, no hospital context (null)
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      let hospitalId: string | null = null;

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
        await this.doctorProfileRepo.findByEmailAndHospitalId(
          dto.email,
          hospitalId,
        )
      ) {
        throw new BusinessRuleViolationException(
          `Email '${dto.email}' is already used for a doctor profile at this hospital`,
        );
      }

      const account = await this.accountCreationService.createUsernameAccount(
        dto.username,
        dto.email,
        dto.password,
        'doctor',
        session,
      );

      const doctor = await this.doctorProfileRepo.create(
        {
          fullName: dto.fullName,
          designation: dto.designation,
          specialization: dto.specialization,
          phone: dto.phone,
          email: dto.email,
          addressId: null,
          accountId: account.id,
          slug: generateSlugFromName(dto.fullName),
          bio: dto.bio ?? null,
          profilePhotoUrl: null,
          createdBy: createdByAccountId,
          hospitalId,
        },
        session,
      );

      const hospitalRole = await this.roleService.findByName('hospital');
      if (hospitalRole) {
        await this.createInitialStatus(
          {
            doctorProfileId: doctor.id,
            updatedByAccountId: hospitalId!,
            updatedByRoleId: hospitalRole.id,
            status: AvailabilityStatus.AVAILABLE,
          },
          session,
        );
      }

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

  async createInitialStatus(
    data: CreateDoctorStatusInput,
    session?: ClientSession,
  ): Promise<void> {
    this.logger.debug(
      `Creating initial status for doctor profile: ${data.doctorProfileId}`,
    );
    await this.doctorStatusRepo.create(
      {
        ...data,
        status: AvailabilityStatus.AVAILABLE,
      },
      session,
    );
  }

  async updateStatus(data: UpdateDoctorStatusDto): Promise<void> {
    this.logger.debug(
      `Updating status for doctor profile ${data.doctorProfileId} by account ${data.updatedByAccountId}`,
    );

    const doctorProfile = await this.doctorProfileRepo.findById(
      data.doctorProfileId!,
    );
    if (!doctorProfile) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }

    const account = await this.accountService.findById(
      data.updatedByAccountId!,
    );
    const roleNames: string[] = [];
    for (const assignment of account.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    const isDoctor = roleNames.includes('doctor');
    const isHospital = roleNames.includes('hospital');

    let isAuthorized = false;
    let updaterRoleId = '';

    if (isSuperAdmin) {
      isAuthorized = true;
      const saIndex = roleNames.indexOf('super_admin');
      updaterRoleId = account.roles[saIndex].roleId;
    } else if (isDoctor) {
      if (doctorProfile.accountId === data.updatedByAccountId) {
        isAuthorized = true;
        const doctorIndex = roleNames.indexOf('doctor');
        updaterRoleId = account.roles[doctorIndex].roleId;
      }
    } else if (isHospital) {
      const hospital = await this.hospitalService.findByAccountId(
        data.updatedByAccountId!,
      );
      if (
        hospital &&
        (doctorProfile.hospitalId === hospital.id ||
          doctorProfile.hospitalId === hospital.accountId)
      ) {
        isAuthorized = true;
        const hospitalIndex = roleNames.indexOf('hospital');
        updaterRoleId = account.roles[hospitalIndex].roleId;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to update this doctor status',
      );
    }

    await this.doctorStatusRepo.updateStatus({
      ...data,
      doctorProfileId: data.doctorProfileId!,
      updatedByAccountId: data.updatedByAccountId!,
      updatedByRoleId: updaterRoleId,
    });
  }
}
