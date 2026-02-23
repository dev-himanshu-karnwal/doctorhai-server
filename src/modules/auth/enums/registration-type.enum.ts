export const REGISTRATION_TYPE = ['hospital', 'doctor'] as const;
export type RegistrationType = (typeof REGISTRATION_TYPE)[number];
