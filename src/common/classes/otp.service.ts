import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OTP_EXPIRY_MS, OTP_MAX_ATTEMPTS } from '../constants';
import type { IOtpService } from '../interfaces';

@Injectable()
export class OtpService implements IOtpService {
  generateOtp(): string {
    const value = Math.floor(100000 + Math.random() * 900000);
    return value.toString();
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 12) as Promise<string>;
  }

  getExpiryDate(): Date {
    return new Date(Date.now() + OTP_EXPIRY_MS);
  }

  hasExceededMaxAttempts(attempts: number): boolean {
    return attempts >= OTP_MAX_ATTEMPTS;
  }

  async compareOtp(plainOtp: string, otpHash: string): Promise<boolean> {
    return bcrypt.compare(plainOtp, otpHash) as Promise<boolean>;
  }
}
