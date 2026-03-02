import { Injectable, Inject } from '@nestjs/common';
import { DOCTOR_PROFILE_REPOSITORY_TOKEN } from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IDoctorProfileRepository } from '../interfaces/doctor-profile-repository.interface';
import type { IProfileCoreService } from '../interfaces/profile-core-service.interface';

/**
 * Service for core profile utilities and cross-module shared logic.
 */
@Injectable()
export class ProfileCoreService implements IProfileCoreService {
  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
  ) {}

  /**
   * Wrapper for the slug generation utility.
   */
  generateSlug(name: string): string {
    return generateSlugFromName(name.trim());
  }

  /**
   * Validates if an email is available for a doctor profile within a specific hospital scope.
   * Prevents duplicate doctor profiles with the same email in the same hospital.
   */
  async ensureEmailAvailableForHospital(
    email: string,
    hospitalId: string | null,
    excludeProfileId?: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.doctorProfileRepo.findByEmailAndHospitalId(
      normalizedEmail,
      hospitalId,
    );

    if (existing && existing.id !== excludeProfileId) {
      throw new BusinessRuleViolationException(
        `Email '${normalizedEmail}' is already used for a doctor profile at this hospital`,
      );
    }
  }
}
