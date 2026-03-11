export interface IProfilePermissionService {
  /**
   * Checks if an account has permission to update a specific doctor profile.
   * Logic shared between DoctorProfilesService and DoctorStatusesService.
   */
  canUpdateDoctorProfile(
    requestedByAccountId: string,
    doctorProfileId: string,
  ): Promise<{ authorized: boolean; updaterRoleId: string }>;

  /**
   * Checks if an account has permission to update the status of a specific doctor profile.
   */
  canUpdateDoctorStatus(
    requestedByAccountId: string,
    doctorProfileId: string,
  ): Promise<{ authorized: boolean; updaterRoleId: string }>;
}
