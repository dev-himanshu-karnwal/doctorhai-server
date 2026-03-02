import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  DOCTOR_STATUS_REPOSITORY_TOKEN,
  PROFILE_PERMISSION_SERVICE_TOKEN,
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import type {
  IDoctorStatusRepository,
  IDoctorStatusService,
} from '../interfaces';
import type {
  IDoctorProfileRepository,
  IProfilePermissionService,
} from '../../doctor-profiles/interfaces';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

/**
 * Service for managing doctor availability statuses.
 * Refactored to use ProfilePermissionService for centralized authorization logic.
 */
@Injectable()
export class DoctorStatusesService implements IDoctorStatusService {
  private readonly logger = new Logger(DoctorStatusesService.name);

  constructor(
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN as symbol)
    private readonly doctorStatusRepo: IDoctorStatusRepository,
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(PROFILE_PERMISSION_SERVICE_TOKEN)
    private readonly profilePermissionService: IProfilePermissionService,
  ) {}

  /**
   * Updates or creates (upserts) a doctor's status.
   * Authorization is handled by the ProfilePermissionService.
   */
  async updateStatus(data: UpdateDoctorStatusDto): Promise<void> {
    this.logger.debug(
      `Updating status for doctor profile ${data.doctorProfileId} by account ${data.updatedByAccountId}`,
    );

    // Basic validation
    if (!data.doctorProfileId) {
      throw new BusinessRuleViolationException('Doctor profile id is required');
    }
    if (!data.updatedByAccountId) {
      throw new BusinessRuleViolationException(
        'Updated by account id is required',
      );
    }

    // Verify ownership/permission via centralized ProfilePermissionService.
    // This simplifies the logic significantly by removing manual role and ownership checks.
    const { updaterRoleId } =
      await this.profilePermissionService.canUpdateDoctorStatus(
        data.updatedByAccountId,
        data.doctorProfileId,
      );

    // Check if status entry exists to decide between create and update (Upsert)
    const existingStatus = await this.doctorStatusRepo.findByDoctorProfileId(
      data.doctorProfileId,
    );

    if (!existingStatus) {
      this.logger.debug(
        `No existing status for doctor ${data.doctorProfileId}, creating new entry`,
      );
      // Create new status entry
      await this.doctorStatusRepo.create({
        doctorProfileId: data.doctorProfileId,
        status: data.status,
        updatedByAccountId: data.updatedByAccountId,
        updatedByRoleId: updaterRoleId,
        expectedAt: data.expectedAt,
        expectedAtNote: data.expectedAtNote,
      });
    } else {
      this.logger.debug(
        `Updating existing status for doctor ${data.doctorProfileId}`,
      );
      // Update existing status entry
      await this.doctorStatusRepo.updateStatus({
        ...data,
        doctorProfileId: data.doctorProfileId,
        updatedByAccountId: data.updatedByAccountId,
        updatedByRoleId: updaterRoleId,
      });
    }
  }
}
