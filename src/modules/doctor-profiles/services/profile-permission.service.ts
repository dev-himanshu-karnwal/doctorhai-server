import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import type { IDoctorProfileRepository } from '../interfaces/doctor-profile-repository.interface';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { IProfilePermissionService } from '../interfaces/profile-permission-service.interface';

/**
 * Service responsible for centralized authorization logic regarding doctor profiles.
 * This logic was previously duplicated across DoctorProfilesService and DoctorStatusesService.
 */
@Injectable()
export class ProfilePermissionService implements IProfilePermissionService {
  private readonly logger = new Logger(ProfilePermissionService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
  ) {}

  /**
   * Checks if the requester has permission to update a doctor profile.
   * Rules:
   * 1. Super Admin: Always authorized.
   * 2. Doctor: Authorized if they own the profile.
   * 3. Hospital: Authorized if the doctor belongs to their hospital.
   */
  async canUpdateDoctorProfile(
    requestedByAccountId: string,
    doctorProfileId: string,
  ): Promise<{ authorized: boolean; updaterRoleId: string }> {
    const doctorProfile =
      await this.doctorProfileRepo.findById(doctorProfileId);
    if (!doctorProfile) {
      return { authorized: false, updaterRoleId: '' };
    }

    const account = await this.accountService.findById(requestedByAccountId);
    const roleNames: string[] = [];

    // Collect all role names for the requester
    for (const assignment of account.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    const isDoctor = roleNames.includes('doctor');
    const isHospital = roleNames.includes('hospital');

    // 1. Super Admin logic
    if (isSuperAdmin) {
      const saIndex = roleNames.indexOf('super_admin');
      return { authorized: true, updaterRoleId: account.roles[saIndex].roleId };
    }

    // 2. Doctor logic (ownership check)
    if (isDoctor && doctorProfile.accountId === requestedByAccountId) {
      const doctorRoleIndex = roleNames.indexOf('doctor');
      return {
        authorized: true,
        updaterRoleId: account.roles[doctorRoleIndex].roleId,
      };
    }

    // 3. Hospital logic (management check)
    if (isHospital) {
      const hospital =
        await this.hospitalService.findByAccountId(requestedByAccountId);
      if (
        hospital &&
        (doctorProfile.hospitalId === hospital.id ||
          doctorProfile.hospitalId === hospital.accountId)
      ) {
        const hospitalRoleIndex = roleNames.indexOf('hospital');
        return {
          authorized: true,
          updaterRoleId: account.roles[hospitalRoleIndex].roleId,
        };
      }
    }

    return { authorized: false, updaterRoleId: '' };
  }

  /**
   * Helper method that throws ForbiddenException if not authorized.
   */
  async canUpdateDoctorStatus(
    requestedByAccountId: string,
    doctorProfileId: string,
  ): Promise<{ authorized: boolean; updaterRoleId: string }> {
    const result = await this.canUpdateDoctorProfile(
      requestedByAccountId,
      doctorProfileId,
    );
    if (!result.authorized) {
      throw new ForbiddenException(
        'You are not authorized to perform this action on this doctor profile',
      );
    }
    return result;
  }
}
