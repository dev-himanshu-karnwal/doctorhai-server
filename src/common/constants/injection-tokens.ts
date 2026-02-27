// Addresses module
export const ADDRESS_REPOSITORY_TOKEN = Symbol('IAddressRepository');
export const ADDRESS_SERVICE_TOKEN = Symbol('IAddressService');

// Hospitals module
export const HOSPITAL_REPOSITORY_TOKEN = Symbol('IHospitalRepository');
export const HOSPITAL_SERVICE_TOKEN = Symbol('IHospitalService');

// Doctor-profiles module
export const DOCTOR_PROFILE_REPOSITORY_TOKEN = Symbol(
  'IDoctorProfileRepository',
);
export const DOCTOR_PROFILE_SERVICE_TOKEN = Symbol('IDoctorProfileService');

// Auth module
export const PERMISSION_REPOSITORY_TOKEN = Symbol('IPermissionRepository');
export const ROLE_REPOSITORY_TOKEN = Symbol('IRoleRepository');
export const ACCOUNT_REPOSITORY_TOKEN = Symbol('IAccountRepository');
export const PASSWORD_RESET_REPOSITORY_TOKEN = Symbol(
  'IPasswordResetRepository',
);
export const OTP_SERVICE_TOKEN = Symbol('IOtpService');
export const PERMISSION_SERVICE_TOKEN = Symbol('IPermissionService');
export const ROLE_SERVICE_TOKEN = Symbol('IRoleService');
export const ACCOUNT_SERVICE_TOKEN = Symbol('IAccountService');
export const PASSWORD_RESET_SERVICE_TOKEN = Symbol('IPasswordResetService');
export const AUTH_FLOW_SERVICE_TOKEN = Symbol('IAuthFlowService');
export const ACCOUNT_CREATION_SERVICE_TOKEN = Symbol('IAccountCreationService');

// Infra
export const MAIL_SERVICE_TOKEN = Symbol('IMailService');
