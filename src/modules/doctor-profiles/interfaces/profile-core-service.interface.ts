export interface IProfileCoreService {
  /**
   * Generates a URL-friendly slug from a name.
   */
  generateSlug(name: string): string;

  /**
   * Ensures that an email is not already in use for a specific profile type
   * within a given hospital context.
   */
  ensureEmailAvailableForHospital(
    email: string,
    hospitalId: string | null,
    excludeProfileId?: string,
  ): Promise<void>;
}
