/**
 * Seed data: permissions, roles, and superadmin user.
 */

export const PERMISSIONS = [
  {
    key: 'hospital.doctor.create',
    description: 'Create a new doctor under a hospital',
  },
  {
    key: 'hospital.doctor.update',
    description: 'Update doctor details under a hospital',
  },
  {
    key: 'hospital.doctor.delete',
    description: 'Remove a doctor from hospital',
  },
  {
    key: 'hospital.doctor.status.update',
    description: 'Update doctor availability status under a hospital',
  },
  {
    key: 'hospital.manage',
    description: 'Manage hospital-level settings and details',
  },
  {
    key: 'doctor.self.status.update',
    description: 'Doctor can update their own availability status',
  },
  {
    key: 'doctor.self.profile.update',
    description: 'Doctor can update their own profile details',
  },
  {
    key: 'doctor.self.session.manage',
    description: 'Doctor can manage their own login session',
  },
  {
    key: 'super_admin.manage',
    description: 'Manage hospitals, doctors, and permissions',
  },
  { key: 'super_admin.users', description: 'Manage users' },
];

export const ROLES = [
  {
    name: 'doctor',
    description: 'Doctor role',
    isSystem: true,
    permissionKeys: [
      'doctor.self.status.update',
      'doctor.self.profile.update',
      'doctor.self.session.manage',
    ],
  },
  {
    name: 'hospital',
    description: 'Hospital admin role',
    isSystem: true,
    permissionKeys: [
      'hospital.doctor.create',
      'hospital.doctor.update',
      'hospital.doctor.delete',
      'hospital.doctor.status.update',
      'hospital.manage',
    ],
  },
  {
    name: 'superadmin',
    description: 'Super administrator',
    isSystem: true,
    permissionKeys: [
      'super_admin.manage',
      'super_admin.users',
      'hospital.doctor.create',
      'hospital.doctor.update',
      'hospital.doctor.delete',
      'hospital.doctor.status.update',
      'hospital.manage',
      'doctor.self.status.update',
      'doctor.self.profile.update',
      'doctor.self.session.manage',
    ],
  },
];

export const SUPERADMIN = {
  name: 'Himanshu',
  email: 'himanshukar1810@gmail.com',
  password: 'Admin@123',
};
