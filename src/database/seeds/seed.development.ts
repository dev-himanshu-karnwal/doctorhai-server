/**
 * Seed entry point: permissions, roles, superadmin user.
 *
 * Run: pnpm seed:dev
 */
import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

import {
  createDataSource,
  closeDataSource,
  seedPermissions,
  seedRoles,
  seedSuperadmin,
} from './common/seed-helpers';
import { PERMISSIONS, ROLES, SUPERADMIN } from './seed-data';

async function run(): Promise<void> {
  console.log('Seeding database...');
  const conn = await createDataSource();
  try {
    await seedPermissions(conn, PERMISSIONS);
    console.log('  ✓ Permissions');
    await seedRoles(conn, ROLES);
    console.log('  ✓ Roles');
    await seedSuperadmin(conn, SUPERADMIN);
    console.log('  ✓ Superadmin user');
  } finally {
    await closeDataSource(conn);
  }
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
