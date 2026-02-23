/**
 * Production seed: permissions, roles, superadmin user.
 *
 * Run: pnpm seed:prod
 */
import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.production') });

import {
  createDataSource,
  closeDataSource,
  seedPermissions,
  seedRoles,
  seedSuperadmin,
} from './common/seed-helpers';
import { PERMISSIONS, ROLES, SUPERADMIN } from './seed-data';

async function run(): Promise<void> {
  console.log('Seeding production database...');
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
