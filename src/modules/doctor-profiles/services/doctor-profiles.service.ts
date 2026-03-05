import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  PROFILE_PERMISSION_SERVICE_TOKEN,
  PROFILE_CORE_SERVICE_TOKEN,
  DOCTOR_STATUS_REPOSITORY_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import type { IAccountCreationService } from '../../auth/interfaces/account-creation-service.interface';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { IDoctorStatusRepository } from '../../doctor-statuses/interfaces';
import type { ClientSession, Connection } from 'mongoose';
import type {
  IDoctorProfileRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
  DoctorsQuery,
  IProfilePermissionService,
  IProfileCoreService,
} from '../interfaces';
import { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import type { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import {
  DoctorProfileResponseDto,
  PaginatedDoctorsResponseDto,
} from '../dto/doctor-profile-response.dto';

/**
 * Service for managing doctor profiles.
 * Refactored to use ProfilePermissionService and ProfileCoreService for better reusability.
 */
@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN)
    private readonly doctorStatusRepo: IDoctorStatusRepository,
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(PROFILE_PERMISSION_SERVICE_TOKEN)
    private readonly profilePermissionService: IProfilePermissionService,
    @Inject(PROFILE_CORE_SERVICE_TOKEN)
    private readonly profileCoreService: IProfileCoreService,
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

  /**
   * Complex workflow to create a doctor account and profile initiated by a hospital.
   */
  async createByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['createByHospital']>>> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      let hospitalId: string | null = null;
      const email = dto.email.toLowerCase().trim();

      // Determine the hospital ID for the new doctor
      const hospital =
        await this.hospitalService.findByAccountId(createdByAccountId);
      if (hospital) {
        hospitalId = hospital.id;
      } else {
        const creatorDoctor =
          await this.doctorProfileRepo.findByAccountId(createdByAccountId);
        hospitalId = creatorDoctor?.hospitalId ?? null;
      }

      // Use ProfileCoreService to ensure email uniqueness within the hospital
      await this.profileCoreService.ensureEmailAvailableForHospital(
        email,
        hospitalId,
      );

      // Create the authentication account
      const account = await this.accountCreationService.createUsernameAccount(
        dto.username,
        email,
        dto.password,
        'doctor',
        session,
      );

      // Create the profile linked to the new account
      const doctor = await this.doctorProfileRepo.create(
        {
          fullName: dto.fullName.trim(),
          designation: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          specialization: dto.specialization ? dto.specialization : null,
          phone: dto.phone,
          email,
          addressId: null,
          accountId: account.id,
          slug: this.profileCoreService.generateSlug(dto.fullName),
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

  async getDoctors(query: DoctorsQuery): Promise<PaginatedDoctorsResponseDto> {
    this.logger.debug(`Listing doctors with query: ${JSON.stringify(query)}`);
    const result = await this.doctorProfileRepo.findDoctors(query);

    const doctors: DoctorProfileResponseDto[] = result.doctors.map(
      (doctor) => ({
        id: doctor.id,
        fullName: doctor.fullName,
        designation: doctor.designation,
        specialization: doctor.specialization,
        phone: doctor.phone,
        email: doctor.email,
        slug: doctor.slug,
        profilePhotoUrl: doctor.profilePhotoUrl,
        hasExperience: doctor.hasExperience,
      }),
    );

    const totalPages =
      result.limit > 0
        ? Math.max(1, Math.ceil(result.total / result.limit))
        : 1;

    return {
      doctors,
      paginatedmetadata: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
      },
    };
  }

  async getDoctorById(id: string): Promise<DoctorProfileResponseDto> {
    this.logger.debug(`Getting doctor profile by id: ${id}`);
    const doctor = await this.doctorProfileRepo.findById(id);
    if (!doctor) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }

    const response: DoctorProfileResponseDto = {
      id: doctor.id,
      fullName: doctor.fullName,
      designation: doctor.designation,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email,
      slug: doctor.slug,
      profilePhotoUrl: doctor.profilePhotoUrl,
      hasExperience: doctor.hasExperience,
    };

    const status = await this.doctorStatusRepo.findByDoctorProfileId(id);
    if (status) {
      response.status = {
        status: status.status,
        expectedAt: status.expectedAt,
        expectedAtNote: status.expectedAtNote,
        updatedAt: status.updatedAt,
      };
    }

    return response;
  }

  async updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<
    Awaited<ReturnType<IDoctorProfileService['updateEmailByAccountId']>>
  > {
    this.logger.debug(
      `Updating doctor profile email by accountId: ${accountId}`,
    );
    return this.doctorProfileRepo.updateEmailByAccountId(accountId, email);
  }

  /**
   * Updates a doctor's profile data.
   * Leverages ProfilePermissionService for shared authorization logic.
   */
  async updateProfile(
    doctorProfileId: string,
    dto: UpdateDoctorProfileDto,
    updatedByAccountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['updateProfile']>>> {
    this.logger.debug(
      `Updating profile for doctor ${doctorProfileId} by account ${updatedByAccountId}`,
    );

    // Verify ownership/permission via centralized ProfilePermissionService
    const { authorized } =
      await this.profilePermissionService.canUpdateDoctorProfile(
        updatedByAccountId,
        doctorProfileId,
      );

    if (!authorized) {
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
      hasExperience?: string | null;
    } = {};

    // Map DTO to update object and regenerate slug if name changes
    if (dto.fullName != null) {
      updateData.fullName = dto.fullName;
      updateData.slug = this.profileCoreService.generateSlug(dto.fullName);
    }
    if (dto.designation !== undefined)
      updateData.designation = dto.designation?.trim() || null;
    if (dto.specialization !== undefined)
      updateData.specialization = dto.specialization?.trim() || null;
    if (dto.bio !== undefined) updateData.bio = dto.bio?.trim() || null;
    if (dto.hasExperience !== undefined)
      updateData.hasExperience = dto.hasExperience ?? null;

    const updated = await this.doctorProfileRepo.update(
      doctorProfileId,
      updateData,
    );
    if (!updated) {
      throw new BusinessRuleViolationException('Doctor profile not found');
    }
    return updated;
  }

  async getSpecializationsByHospitalIds(
    hospitalIds: string[],
  ): Promise<Map<string, string[]>> {
    const rawData =
      await this.doctorProfileRepo.findSpecializationsByHospitalIds(
        hospitalIds,
      );
    const map = new Map<string, string[]>();

    for (const item of rawData) {
      const existing = map.get(item.hospitalId) || [];
      if (!existing.includes(item.specialization)) {
        existing.push(item.specialization);
      }
      map.set(item.hospitalId, existing);
    }

    return map;
  }
}
