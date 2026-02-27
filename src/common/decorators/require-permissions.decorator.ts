import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';

export interface RequirePermissionsOptions {
  /** Permission keys (e.g. 'hospital.doctor.create'). User must have at least one when requireAll is false, or all when true. */
  permissions: string[];
  /** If true, user must have every listed permission. If false, user must have at least one. Default: false. */
  requireAll?: boolean;
}

/**
 * Protects a route by requiring the current user to have one or more permissions.
 * Use with PermissionsGuard. Permissions are resolved from the user's roles.
 *
 * @example
 * // Require any of the listed permissions (OR)
 * @RequirePermissions({ permissions: ['hospital.doctor.create', 'super_admin.manage'] })
 *
 * @example
 * // Require all listed permissions (AND)
 * @RequirePermissions({ permissions: ['hospital.doctor.create', 'hospital.manage'], requireAll: true })
 */
export const RequirePermissions = (
  options: RequirePermissionsOptions,
): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, {
    permissions: options.permissions,
    requireAll: options.requireAll ?? false,
  });
