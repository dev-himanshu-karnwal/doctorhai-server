import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
  PASSWORD_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IAuthFlowService } from '../interfaces/auth-flow-service.interface';
import type { IIdentityService } from '../interfaces/identity-service.interface';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
  MeResponseDto,
  ChangePasswordDto,
  VerifyPasswordDto,
  VerifyPasswordResponseDto,
  ActionResultDto,
} from '../dto';
import { AuthMeService } from './auth-me.service';
import { AuthRegistrationService } from './auth-registration.service';

@Injectable()
export class AuthFlowService implements IAuthFlowService {
  private readonly logger = new Logger(AuthFlowService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(IDENTITY_SERVICE_TOKEN)
    private readonly identityService: IIdentityService,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(PASSWORD_SERVICE_TOKEN)
    private readonly passwordService: IPasswordService,
    private readonly authMeService: AuthMeService,
    private readonly authRegistrationService: AuthRegistrationService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authRegistrationService.register(dto);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.authRegistrationService.login(dto);
  }

  async checkUsernameAvailable(
    username: string,
  ): Promise<CheckUsernameResponseDto> {
    return this.authRegistrationService.checkUsernameAvailable(username);
  }

  async getMe(accountId: string): Promise<MeResponseDto> {
    return this.authMeService.getMe(accountId);
  }

  async getPermissionKeysForAccount(accountId: string): Promise<string[]> {
    return this.authMeService.getPermissionKeysForAccount(accountId);
  }

  async updateEmail(
    requestedByAccountId: string,
    targetAccountId: string,
    newEmail: string,
  ): Promise<void> {
    await this.ensureCanManageAccount(
      requestedByAccountId,
      targetAccountId,
      'update this account email',
    );

    const account = await this.accountRepo.findById(targetAccountId);
    if (!account) {
      throw new ResourceNotFoundException('Account', targetAccountId);
    }

    const normalizedEmail = newEmail.toLowerCase().trim();
    if (normalizedEmail === account.email) {
      return;
    }

    if (account.loginType === 'email') {
      const existing = await this.identityService.findOneByLogin(
        'email',
        normalizedEmail,
      );
      if (existing && existing.id !== targetAccountId) {
        throw new BusinessRuleViolationException(
          `Email '${normalizedEmail}' is already used by another account`,
        );
      }
    }

    const doctorProfile =
      await this.doctorProfileService.findByAccountId(targetAccountId);
    if (doctorProfile) {
      const conflict = await this.doctorProfileService.findByEmailAndHospitalId(
        normalizedEmail,
        doctorProfile.hospitalId,
      );
      if (conflict && conflict.id !== doctorProfile.id) {
        throw new BusinessRuleViolationException(
          `Email '${normalizedEmail}' is already used for this profile type`,
        );
      }
    }

    await this.accountRepo.update(targetAccountId, { email: normalizedEmail });
    await this.hospitalService.updateEmailByAccountId(
      targetAccountId,
      normalizedEmail,
    );
    await this.doctorProfileService.updateEmailByAccountId(
      targetAccountId,
      normalizedEmail,
    );

    this.logger.log(
      `Updated email for account ${targetAccountId} to ${normalizedEmail}`,
    );
  }

  async setAccountVerified(
    accountId: string,
    verified: boolean,
  ): Promise<void> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new ResourceNotFoundException('Account', accountId);
    }
    await this.accountRepo.update(accountId, { isVerified: verified });
    this.logger.log(
      `Account ${accountId} verification set to ${verified} by superadmin`,
    );
  }

  async changePassword(
    requestedByAccountId: string,
    targetAccountId: string,
    dto: ChangePasswordDto,
  ): Promise<ActionResultDto> {
    await this.ensureCanManageAccount(
      requestedByAccountId,
      targetAccountId,
      'change this account password',
    );

    if (dto.oldPassword === dto.newPassword) {
      throw new BusinessRuleViolationException(
        'New password must be different from old password',
      );
    }

    const account = await this.accountRepo.findById(targetAccountId);
    if (!account) {
      throw new ResourceNotFoundException('Account', targetAccountId);
    }

    if (!account.passwordHash) {
      throw new BusinessRuleViolationException(
        'Account does not have a password set',
      );
    }

    const isMatch = await this.passwordService.compare(
      dto.oldPassword,
      account.passwordHash,
    );
    if (!isMatch) {
      return { success: false, message: 'Invalid old password' };
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);
    await this.accountRepo.update(targetAccountId, {
      passwordHash: newPasswordHash,
      passwordUpdatedAt: new Date().toISOString(),
    });

    this.logger.log(`Changed password for account ${targetAccountId}`);
    return { success: true, message: 'Password changed successfully' };
  }

  async verifyPassword(
    accountId: string,
    dto: VerifyPasswordDto,
  ): Promise<VerifyPasswordResponseDto> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new ResourceNotFoundException('Account', accountId);
    }

    if (!account.passwordHash) {
      return { isVerified: false, message: 'Invalid password' };
    }

    const isVerified = await this.passwordService.compare(
      dto.password,
      account.passwordHash,
    );

    return {
      isVerified,
      message: isVerified
        ? 'Password verified successfully'
        : 'Invalid password',
    };
  }

  private async ensureCanManageAccount(
    requestedByAccountId: string,
    targetAccountId: string,
    actionLabel: string,
  ): Promise<void> {
    if (requestedByAccountId === targetAccountId) {
      return;
    }

    const permissions =
      await this.getPermissionKeysForAccount(requestedByAccountId);
    const isSuperAdmin = permissions.includes('super_admin.manage');
    const canUpdateHospitalDoctor = permissions.includes(
      'hospital.doctor.update',
    );

    if (!isSuperAdmin && !canUpdateHospitalDoctor) {
      throw new ForbiddenException(`Not allowed to ${actionLabel}`);
    }

    if (canUpdateHospitalDoctor && !isSuperAdmin) {
      const callerHospital =
        await this.hospitalService.findByAccountId(requestedByAccountId);
      const targetDoctor =
        await this.doctorProfileService.findByAccountId(targetAccountId);

      if (
        !callerHospital ||
        !targetDoctor ||
        targetDoctor.hospitalId?.toString() !== callerHospital.id?.toString()
      ) {
        throw new ForbiddenException(`Not allowed to ${actionLabel}`);
      }
    }
  }
}
