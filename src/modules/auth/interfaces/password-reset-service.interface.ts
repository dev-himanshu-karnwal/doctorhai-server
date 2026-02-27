export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ForgotPasswordVerifyDto {
  email: string;
  otp: string;
}

export interface ForgotPasswordResetDto {
  accountId: string;
  newPassword: string;
}

export interface ResetProfilesItem {
  accountId: string;
  type: 'doctor' | 'hospital';
  name: string;
}

export interface ForgotPasswordVerifyResult {
  resetToken: string;
  profiles: ResetProfilesItem[];
}

export interface IPasswordResetService {
  requestReset(dto: ForgotPasswordRequestDto): Promise<void>;
  verifyOtp(dto: ForgotPasswordVerifyDto): Promise<ForgotPasswordVerifyResult>;
  resetPassword(resetToken: string, dto: ForgotPasswordResetDto): Promise<void>;
}
