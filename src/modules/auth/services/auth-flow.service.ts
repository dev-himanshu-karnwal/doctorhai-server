import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
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
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
  MeResponseDto,
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
    @Inject(IDENTITY_SERVICE_TOKEN)
    private readonly identityService: IIdentityService,
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
    if (targetAccountId !== requestedByAccountId) {
      const permissions =
        await this.getPermissionKeysForAccount(requestedByAccountId);
      const isSuperAdmin = permissions.includes('super_admin.manage');
      const canUpdateHospitalDoctor = permissions.includes(
        'hospital.doctor.update',
      );
      if (!isSuperAdmin && !canUpdateHospitalDoctor) {
        throw new ForbiddenException(
          'Not allowed to update this account email',
        );
      }
      if (canUpdateHospitalDoctor && !isSuperAdmin) {
        const callerHospital =
          await this.hospitalService.findByAccountId(requestedByAccountId);
        const targetDoctor =
          await this.doctorProfileService.findByAccountId(targetAccountId);
        if (
          !callerHospital ||
          !targetDoctor ||
          targetDoctor.hospitalId !== callerHospital.id
        ) {
          throw new ForbiddenException(
            'Not allowed to update this account email',
          );
        }
      }
    }

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
}
