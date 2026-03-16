// Addresses module
export const ADDRESS_REPOSITORY_TOKEN = Symbol('IAddressRepository');
export const ADDRESS_SERVICE_TOKEN = Symbol('IAddressService');

// Hospitals module
export const HOSPITAL_REPOSITORY_TOKEN = Symbol('IHospitalRepository');
export const HOSPITAL_SERVICE_TOKEN = Symbol('IHospitalService');

//Hospital-profile module
export const HOSPITAL_PROFILE_SERVICE_TOKEN = Symbol('IHospitalService');

// Doctor-profiles module
export const DOCTOR_PROFILE_REPOSITORY_TOKEN = Symbol(
  'IDoctorProfileRepository',
);
export const DOCTOR_PROFILE_SERVICE_TOKEN = Symbol('IDoctorProfileService');
export const DOCTOR_STATUS_REPOSITORY_TOKEN = Symbol('IDoctorStatusRepository');
export const DOCTOR_STATUS_SERVICE_TOKEN = Symbol('IDoctorStatusService');

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
export const ACCOUNT_MANAGEMENT_SERVICE_TOKEN = Symbol(
  'IAccountManagementService',
);
export const PASSWORD_RESET_SERVICE_TOKEN = Symbol('IPasswordResetService');
export const AUTH_FLOW_SERVICE_TOKEN = Symbol('IAuthFlowService');
export const ACCOUNT_CREATION_SERVICE_TOKEN = Symbol('IAccountCreationService');
export const PASSWORD_SERVICE_TOKEN = Symbol('IPasswordService');
export const IDENTITY_SERVICE_TOKEN = Symbol('IIdentityService');
export const CREDENTIAL_SERVICE_TOKEN = Symbol('ICredentialService');
export const TOKEN_SERVICE_TOKEN = Symbol('TOKEN_SERVICE_TOKEN');
export const PROFILE_PERMISSION_SERVICE_TOKEN = Symbol(
  'PROFILE_PERMISSION_SERVICE_TOKEN',
);
export const PROFILE_CORE_SERVICE_TOKEN = Symbol('PROFILE_CORE_SERVICE_TOKEN');

// Infra
export const MAIL_SERVICE_TOKEN = Symbol('IMailService');
