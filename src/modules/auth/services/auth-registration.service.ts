import {
  Injectable,
  Logger,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../../../config';
import { InjectConnection } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Connection } from 'mongoose';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IAccountCreationService } from '../interfaces/account-creation-service.interface';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
} from '../dto';
import type { CreateAccountDto } from '../dto';
import type { AccountEntity } from '../entities';
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
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
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
      await this.accountCreationService.ensureUsernameAvailable(
        dto.username.trim(),
      );
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

    const bcryptRounds = this.appConfig.bcryptRounds;
    const passwordHash = (await bcrypt.hash(
      dto.password,
      bcryptRounds,
    )) as string;

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
      return this.signAndReturnAuthResponse(account);
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

    const account = await this.accountRepo.findOneByLogin(
      dto.loginType,
      loginValue,
    );
    if (!account) {
      this.logger.warn(
        `Login failed: no account for ${dto.loginType}:${loginValue}`,
      );
      throw new UnauthorizedException('Invalid login credentials');
    }
    if (!account.passwordHash) {
      this.logger.warn(`Login failed: account ${account.id} has no password`);
      throw new UnauthorizedException('Invalid login credentials');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordValid = (await bcrypt.compare(
      dto.password,
      account.passwordHash,
    )) as boolean;
    if (!passwordValid) {
      this.logger.warn(
        `Login failed: wrong password for ${dto.loginType}:${loginValue}`,
      );
      throw new UnauthorizedException('Invalid login credentials');
    }

    this.logger.log(
      `Logged in account ${account.id} (${dto.loginType}:${loginValue})`,
    );

    return this.signAndReturnAuthResponse(account);
  }

  async checkUsernameAvailable(
    username: string,
  ): Promise<CheckUsernameResponseDto> {
    const existing = await this.accountRepo.findOneByLogin(
      'username',
      username,
    );
    return {
      username,
      available: !existing,
    };
  }

  private registrationTypeToRoleName(
    registrationType: RegistrationType,
  ): string {
    return registrationType;
  }

  private signAndReturnAuthResponse(account: AccountEntity): AuthResponseDto {
    const payload = {
      sub: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      accountId: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
    };
  }
}
