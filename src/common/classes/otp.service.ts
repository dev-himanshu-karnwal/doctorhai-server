import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { IOtpService } from '../interfaces';

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

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
    return attempts >= MAX_OTP_ATTEMPTS;
  }

  async compareOtp(plainOtp: string, otpHash: string): Promise<boolean> {
    return bcrypt.compare(plainOtp, otpHash) as Promise<boolean>;
  }
}
