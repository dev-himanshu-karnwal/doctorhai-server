import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  DOCTOR_STATUS_REPOSITORY_TOKEN,
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
  IDoctorStatusRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import type { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN as symbol)
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

  async updateStatus(data: UpdateDoctorStatusDto): Promise<void> {
    this.logger.debug(
      `Updating status for doctor profile ${data.doctorProfileId} by account ${data.updatedByAccountId}`,
    );

    if (!data.doctorProfileId) {
      throw new BusinessRuleViolationException('Doctor profile id is required');
    }
    if (!data.updatedByAccountId) {
      throw new BusinessRuleViolationException(
        'Updated by account id is required',
      );
    }

    const doctorProfile = await this.doctorProfileRepo.findById(
      data.doctorProfileId,
    );
    if (!doctorProfile) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }

    const account = await this.accountService.findById(data.updatedByAccountId);
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
        data.updatedByAccountId,
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
      doctorProfileId: data.doctorProfileId,
      updatedByAccountId: data.updatedByAccountId,
      updatedByRoleId: updaterRoleId,
    });
  }

  async updateProfile(
    doctorProfileId: string,
    dto: UpdateDoctorProfileDto,
    updatedByAccountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['updateProfile']>>> {
    this.logger.debug(
      `Updating profile for doctor ${doctorProfileId} by account ${updatedByAccountId}`,
    );

    const doctorProfile =
      await this.doctorProfileRepo.findById(doctorProfileId);
    if (!doctorProfile) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }

    const account = await this.accountService.findById(updatedByAccountId);
    const roleNames: string[] = [];
    for (const assignment of account.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    const isDoctor = roleNames.includes('doctor');
    const isHospital = roleNames.includes('hospital');

    let isAuthorized = false;
    if (isSuperAdmin) {
      isAuthorized = true;
    } else if (isDoctor && doctorProfile.accountId === updatedByAccountId) {
      isAuthorized = true;
    } else if (isHospital) {
      const hospital =
        await this.hospitalService.findByAccountId(updatedByAccountId);
      if (
        hospital &&
        (doctorProfile.hospitalId === hospital.id ||
          doctorProfile.hospitalId === hospital.accountId)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to update this doctor profile',
      );
    }

    const updateData: {
      fullName?: string;
      designation?: string | null;
      specialization?: string | null;
      bio?: string | null;
      slug?: string;
    } = {};

    if (dto.fullName != null) {
      updateData.fullName = dto.fullName;
      updateData.slug = generateSlugFromName(dto.fullName);
    }
    if (dto.designation !== undefined)
      updateData.designation = dto.designation?.trim() || null;
    if (dto.specialization !== undefined)
      updateData.specialization = dto.specialization?.trim() || null;
    if (dto.bio !== undefined) updateData.bio = dto.bio?.trim() || null;

    const updated = await this.doctorProfileRepo.update(
      doctorProfileId,
      updateData,
    );
    if (!updated) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }
    return updated;
  }
}
