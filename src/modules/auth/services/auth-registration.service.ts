import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  PASSWORD_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
  CREDENTIAL_SERVICE_TOKEN,
  TOKEN_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type { IIdentityService } from '../interfaces/identity-service.interface';
import type { ICredentialService } from '../interfaces/credential-service.interface';
import type { ITokenService } from '../interfaces/token-service.interface';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
} from '../dto';
import type { CreateAccountDto } from '../dto';
import type { RegistrationType } from '../enums/registration-type.enum';

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(PASSWORD_SERVICE_TOKEN)
    private readonly passwordService: IPasswordService,
    @Inject(IDENTITY_SERVICE_TOKEN)
    private readonly identityService: IIdentityService,
    @Inject(CREDENTIAL_SERVICE_TOKEN)
    private readonly credentialService: ICredentialService,
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const roleName = this.registrationTypeToRoleName(dto.registrationType);
    const email = dto.email.toLowerCase().trim();

    if (dto.registrationType === 'doctor') {
      if (!dto.username?.trim()) {
        throw new BusinessRuleViolationException(
          'Username is required when registering as doctor',
        );
      }
      await this.identityService.ensureUsernameAvailable(dto.username.trim());
    }

    if (dto.registrationType === 'doctor') {
      if (
        await this.doctorProfileService.findByEmailAndHospitalId(email, null)
      ) {
        throw new BusinessRuleViolationException(
          `Email '${email}' is already used for an individual doctor profile`,
        );
      }
    }

    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new ResourceNotFoundException('Role', roleName);
    }

    const loginType = dto.registrationType === 'doctor' ? 'username' : 'email';
    const username =
      dto.registrationType === 'doctor'
        ? (dto.username as string).trim()
        : null;

    const passwordHash = await this.passwordService.hash(dto.password);

    const createAccountDto: CreateAccountDto = {
      loginType,
      email,
      username,
      passwordHash,
      isActive: true,
      roles: [{ roleId: role.id }],
    };

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const account = await this.accountRepo.create(createAccountDto, session);

      if (dto.registrationType === 'hospital') {
        await this.hospitalService.create(
          {
            accountId: account.id,
            addressId: null,
            name: dto.name,
            slug: generateSlugFromName(dto.name),
            phone: dto.phone,
            email,
            coverPhotoUrl: null,
          },
          session,
        );
      } else {
        await this.doctorProfileService.create(
          {
            accountId: account.id,
            fullName: dto.name.trim(),
            designation: null,
            specialization: null,
            phone: dto.phone,
            email,
            addressId: null,
            slug: generateSlugFromName(dto.name.trim()),
            bio: null,
            profilePhotoUrl: null,
            createdBy: null,
            hospitalId: null,
          },
          session,
        );
      }

      await session.commitTransaction();
      const identifier =
        account.loginType === 'email'
          ? account.email
          : (account.username ?? '');
      this.logger.log(
        `Registered account ${account.id} as ${dto.registrationType} (${account.loginType}:${identifier})`,
      );
      return this.tokenService.signAuthPayload(account);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      void session.endSession();
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const loginValue = dto.loginType === 'email' ? dto.email : dto.username;
    if (!loginValue) {
      throw new BusinessRuleViolationException(
        dto.loginType === 'email'
          ? 'Email is required when login type is email'
          : 'Username is required when login type is username',
      );
    }

    const account = await this.credentialService.verifyCredentials(
      dto.loginType,
      loginValue,
      dto.password,
    );

    this.logger.log(
      `Logged in account ${account.id} (${dto.loginType}:${loginValue})`,
    );

    return this.tokenService.signAuthPayload(account);
  }

  async checkUsernameAvailable(
    username: string,
  ): Promise<CheckUsernameResponseDto> {
    const available =
      await this.identityService.checkUsernameAvailable(username);
    return {
      username,
      available,
    };
  }

  private registrationTypeToRoleName(
    registrationType: RegistrationType,
  ): string {
    return registrationType;
  }
}
