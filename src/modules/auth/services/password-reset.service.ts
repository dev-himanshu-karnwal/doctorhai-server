import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  ACCOUNT_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  PASSWORD_RESET_REPOSITORY_TOKEN,
  OTP_SERVICE_TOKEN,
  MAIL_SERVICE_TOKEN,
} from '../../../common/constants';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IOtpService } from '../../../common/interfaces';
import type { IAccountService } from '../interfaces';
import type {
  IPasswordResetRepository,
  CreatePasswordResetInput,
} from '../interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  ForgotPasswordRequestDto,
  ForgotPasswordVerifyDto,
  ForgotPasswordResetDto,
  ForgotPasswordVerifyResult,
  IPasswordResetService,
  ResetProfilesItem,
} from '../interfaces/password-reset-service.interface';
import { AccountEntity } from '../entities';
import { AppConfigService } from '../../../config';
import type { IMailService } from '../../../infra/mail/interfaces/mail-service.interface';

interface ResetTokenPayload {
  sub: string;
  email: string;
  accountIds: string[];
  purpose: 'password_reset';
}

const REQUEST_WINDOW_MS = 60 * 1000;

@Injectable()
export class PasswordResetService implements IPasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(PASSWORD_RESET_REPOSITORY_TOKEN)
    private readonly passwordResetRepo: IPasswordResetRepository,
    @Inject(OTP_SERVICE_TOKEN)
    private readonly otpService: IOtpService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(MAIL_SERVICE_TOKEN)
    private readonly mailService: IMailService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
  ) {}

  async requestReset(dto: ForgotPasswordRequestDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();

    const recentReset =
      await this.passwordResetRepo.findLatestActiveByEmail(email);
    if (
      recentReset &&
      recentReset.createdAt.getTime() > Date.now() - REQUEST_WINDOW_MS
    ) {
      this.logger.warn(`Password reset rate limit hit for email: ${email}.`);
      throw new BadRequestException(
        `Password reset rate limit hit. Try again in ${Math.floor((REQUEST_WINDOW_MS - (Date.now() - recentReset.createdAt.getTime())) / 1000)} seconds.`,
      );
    }

    const accounts = (await this.accountService.findAllByEmail(email, [
      'id',
    ])) as Pick<AccountEntity, 'id'>[];
    const accountIds: string[] = accounts.map((account) => account.id);
    if (accountIds.length === 0) return;

    const otp = this.otpService.generateOtp();
    if (this.appConfig.isDevelopment) {
      this.logger.log(`Generated OTP: ${otp}`);
    }
    const otpHash = await this.otpService.hashOtp(otp);
    const expiresAt = this.otpService.getExpiryDate();

    const createInput: CreatePasswordResetInput = {
      email,
      otpHash,
      accountIds,
      expiresAt,
    };

    await this.passwordResetRepo.create(createInput);
    this.logger.log(`Generated password reset OTP for email: ${email}`);

    await this.mailService.sendMail({
      to: email,
      subject: 'DoctorHai password reset code',
      text: `Your password reset code is ${otp}. It expires at ${expiresAt.toISOString()}. If you did not request this, please ignore this email.`,
      html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires at <strong>${expiresAt.toISOString()}</strong>.</p><p>If you did not request this, you can safely ignore this email.</p>`,
    });
  }

  async verifyOtp(
    dto: ForgotPasswordVerifyDto,
  ): Promise<ForgotPasswordVerifyResult> {
    const email = dto.email.toLowerCase().trim();
    const reset = await this.passwordResetRepo.findLatestActiveByEmail(email);

    if (!reset) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (this.otpService.hasExceededMaxAttempts(reset.attempts)) {
      throw new UnauthorizedException('OTP attempts exceeded');
    }

    const isMatch = await this.otpService.compareOtp(dto.otp, reset.otpHash);
    const attempts = reset.attempts + (isMatch ? 0 : 1);
    const verified = isMatch;

    await this.passwordResetRepo.saveAttemptsAndVerification(
      reset.id,
      attempts,
      verified,
    );

    if (!isMatch) {
      if (this.otpService.hasExceededMaxAttempts(attempts)) {
        this.logger.warn(`OTP attempts exceeded for email: ${email}`);
      }
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const accountIds = reset.accountIds;
    if (accountIds.length === 0) {
      throw new ResourceNotFoundException('Account', 'password_reset');
    }

    const profiles = await this.buildProfilesForAccounts(email, accountIds);

    const payload: ResetTokenPayload = {
      sub: email,
      email,
      accountIds,
      purpose: 'password_reset',
    };
    const resetToken = this.jwtService.sign(payload, {
      expiresIn: this.appConfig.jwtExpiresIn,
    });

    return {
      resetToken,
      profiles,
    };
  }

  async resetPassword(
    resetToken: string,
    dto: ForgotPasswordResetDto,
  ): Promise<void> {
    let payload: ResetTokenPayload;
    try {
      payload = this.jwtService.verify<ResetTokenPayload>(resetToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (!payload.accountIds.includes(dto.accountId)) {
      throw new UnauthorizedException('Account not allowed for this token');
    }

    const account = await this.accountService.findById(dto.accountId);

    const passwordHash = (await bcrypt.hash(dto.newPassword, 12)) as string;
    await this.accountService.update(account.id, {
      passwordHash,
      passwordUpdatedAt: new Date().toISOString(),
    });

    await this.passwordResetRepo.deleteAllByEmail(payload.email);
  }

  private async buildProfilesForAccounts(email: string, accountIds: string[]) {
    const profiles: ResetProfilesItem[] = [];
    for (const accountId of accountIds) {
      const doctor = await this.doctorProfileService.findByAccountId(accountId);
      console.log('doctor', doctor);
      if (doctor && doctor.email === email) {
        profiles.push({
          accountId: doctor.accountId,
          type: 'doctor' as const,
          name: doctor.fullName,
        });
        continue;
      }

      const hospital = await this.hospitalService.findByAccountId(accountId);
      console.log('hospital', hospital);
      if (hospital && hospital.email === email) {
        profiles.push({
          accountId: hospital.accountId,
          type: 'hospital' as const,
          name: hospital.name,
        });
      }
    }
    return profiles;
  }
}
