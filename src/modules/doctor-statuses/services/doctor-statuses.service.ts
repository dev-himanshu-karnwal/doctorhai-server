import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import {
  DOCTOR_STATUS_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  IDoctorStatusRepository,
  IDoctorStatusService,
} from '../interfaces';
import type { IDoctorProfileRepository } from '../../doctor-profiles/interfaces';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

@Injectable()
export class DoctorStatusesService implements IDoctorStatusService {
  private readonly logger = new Logger(DoctorStatusesService.name);

  constructor(
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN as symbol)
    private readonly doctorStatusRepo: IDoctorStatusRepository,
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
  ) {}

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
      if (
        doctorProfile.accountId.toString() ===
        data.updatedByAccountId.toString()
      ) {
        isAuthorized = true;
        const doctorIndex = roleNames.indexOf('doctor');
        updaterRoleId = account.roles[doctorIndex].roleId;
      }
    } else if (isHospital) {
      const hospital = await this.hospitalService.findByAccountId(
        data.updatedByAccountId,
      );
      if (hospital) {
        const docHospitalId = doctorProfile.hospitalId?.toString();
        const hospitalId = hospital.id?.toString();
        const hospitalAccountId = hospital.accountId?.toString();

        if (
          docHospitalId &&
          (docHospitalId === hospitalId || docHospitalId === hospitalAccountId)
        ) {
          isAuthorized = true;
          const hospitalIndex = roleNames.indexOf('hospital');
          updaterRoleId = account.roles[hospitalIndex].roleId;
        }
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to update this doctor status',
      );
    }

    // Check if status entry exists to decide between create and update (Upsert)
    const existingStatus = await this.doctorStatusRepo.findByDoctorProfileId(
      data.doctorProfileId,
    );

    if (!existingStatus) {
      this.logger.debug(
        `No existing status for doctor ${data.doctorProfileId}, creating new entry`,
      );
      await this.doctorStatusRepo.create({
        doctorProfileId: data.doctorProfileId,
        status: data.status,
        updatedByAccountId: data.updatedByAccountId,
        updatedByRoleId: updaterRoleId,
        expectedAt: data.expectedAt,
        expectedAtNote: data.expectedAtNote,
      });
    } else {
      await this.doctorStatusRepo.updateStatus({
        ...data,
        doctorProfileId: data.doctorProfileId,
        updatedByAccountId: data.updatedByAccountId,
        updatedByRoleId: updaterRoleId,
      });
    }
  }
}
