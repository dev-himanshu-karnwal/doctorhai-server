import {
  Injectable,
  Logger,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { AuthAccountRegisteredEvent } from '../../../common/events';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IAuthFlowService } from '../interfaces/auth-flow-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type {
  RegisterDto,
  LoginDto,
  CreateDoctorByHospitalDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
} from '../dto';
import type { CreateAccountDto } from '../dto';
import type { RegistrationType } from '../enums/registration-type.enum';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthFlowService implements IAuthFlowService {
  private readonly logger = new Logger(AuthFlowService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const roleName = this.registrationTypeToRoleName(dto.registrationType);

    if (dto.registrationType === 'doctor') {
      if (!dto.username?.trim()) {
        throw new BusinessRuleViolationException(
          'Username is required when registering as doctor',
        );
      }
      const existing = await this.accountRepo.findByLogin(
        'username',
        dto.username.trim(),
      );
      if (existing) {
        throw new BusinessRuleViolationException(
          `Username '${dto.username}' is already taken`,
        );
      }
    }

    if (dto.registrationType === 'hospital' && !dto.slug?.trim()) {
      throw new BusinessRuleViolationException(
        'Slug is required when registering as hospital',
      );
    }

    if (dto.registrationType === 'doctor') {
      if (
        !dto.name?.trim() ||
        !dto.designation?.trim() ||
        !dto.specialization?.trim() ||
        !dto.doctorSlug?.trim()
      ) {
        throw new BusinessRuleViolationException(
          'name, designation, specialization and doctorSlug are required when registering as doctor',
        );
      }
    }

    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new ResourceNotFoundException('Role', roleName);
    }

    const loginType = dto.registrationType === 'doctor' ? 'username' : 'email';
    const loginValue =
      dto.registrationType === 'doctor'
        ? (dto.username as string).trim()
        : dto.email;

    const passwordHash = (await bcrypt.hash(
      dto.password,
      BCRYPT_ROUNDS,
    )) as string;

    const createAccountDto: CreateAccountDto = {
      loginType,
      loginValue,
      passwordHash,
      isActive: true,
      roles: [{ roleId: role.id }],
    };

    const account = await this.accountRepo.create(createAccountDto);

    const addressPayload = {
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    };

    const hospitalPayload =
      dto.registrationType === 'hospital'
        ? {
            name: dto.name,
            slug: (dto.slug as string).trim(),
            coverPhotoUrl: dto.coverPhotoUrl ?? null,
          }
        : undefined;

    const doctorPayload =
      dto.registrationType === 'doctor'
        ? {
            fullName: dto.name.trim(),
            designation: (dto.designation as string).trim(),
            specialization: (dto.specialization as string).trim(),
            slug: (dto.doctorSlug as string).trim(),
            bio: dto.bio ?? null,
            profilePhotoUrl: dto.profilePhotoUrl ?? null,
          }
        : undefined;

    this.eventEmitter.emit(
      'auth.account.registered',
      new AuthAccountRegisteredEvent(
        account.id,
        dto.registrationType,
        dto.email,
        dto.name,
        dto.phone,
        addressPayload,
        dto.registrationType === 'doctor' ? dto.username : undefined,
        hospitalPayload,
        doctorPayload,
      ),
    );

    this.logger.log(
      `Registered account ${account.id} as ${dto.registrationType} (${loginType}:${loginValue})`,
    );

    return this.signAndReturnAuthResponse(account.id, loginType, loginValue);
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

    const account = await this.accountRepo.findByLogin(
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
    return this.signAndReturnAuthResponse(
      account.id,
      account.loginType,
      account.loginValue,
    );
  }

  async checkUsernameAvailable(
    username: string,
  ): Promise<CheckUsernameResponseDto> {
    const existing = await this.accountRepo.findByLogin('username', username);
    return {
      username,
      available: !existing,
    };
  }

  async createDoctorByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<AuthResponseDto> {
    const existing = await this.accountRepo.findByLogin(
      'username',
      dto.username,
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        `Username '${dto.username}' is already taken`,
      );
    }

    const role = await this.roleService.findByName('doctor');
    if (!role) {
      throw new ResourceNotFoundException('Role', 'doctor');
    }

    const passwordHash = (await bcrypt.hash(
      dto.password,
      BCRYPT_ROUNDS,
    )) as string;

    const createAccountDto: CreateAccountDto = {
      loginType: 'username',
      loginValue: dto.username,
      passwordHash,
      isActive: true,
      roles: [{ roleId: role.id }],
    };

    const account = await this.accountRepo.create(createAccountDto);

    const address = await this.addressService.create({
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    await this.doctorProfileService.create({
      fullName: dto.fullName,
      designation: dto.designation,
      specialization: dto.specialization,
      phone: dto.phone,
      email: dto.email,
      addressId: address.id,
      accountId: account.id,
      slug: dto.slug,
      bio: dto.bio ?? null,
      profilePhotoUrl: dto.profilePhotoUrl ?? null,
      createdBy: createdByAccountId,
      hospitalId: dto.hospitalId,
    });

    this.logger.log(
      `Hospital created doctor account ${account.id} (username:${dto.username})`,
    );

    return this.signAndReturnAuthResponse(
      account.id,
      'username',
      account.loginValue,
    );
  }

  private registrationTypeToRoleName(
    registrationType: RegistrationType,
  ): string {
    return registrationType;
  }

  private signAndReturnAuthResponse(
    accountId: string,
    loginType: string,
    loginValue: string,
  ): AuthResponseDto {
    const payload = { sub: accountId, loginType, loginValue };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      accountId,
      loginType,
      loginValue,
    };
  }
}
