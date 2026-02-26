export interface IOtpService {
  generateOtp(): string;
  hashOtp(otp: string): Promise<string>;
  getExpiryDate(): Date;
  hasExceededMaxAttempts(attempts: number): boolean;
  compareOtp(plainOtp: string, otpHash: string): Promise<boolean>;
}
