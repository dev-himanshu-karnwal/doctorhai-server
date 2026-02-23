import {
  Injectable,
  Logger,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Connection } from 'mongoose';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IAuthFlowService } from '../interfaces/auth-flow-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  RegisterDto,
  LoginDto,
  CreateDoctorByHospitalDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
} from '../dto';
import type { CreateAccountDto } from '../dto';
import type { RegistrationType } from '../enums/registration-type.enum';

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
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly connection: Connection,
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

    if (dto.registrationType === 'doctor') {
      if (
        !dto.name?.trim() ||
        !dto.designation?.trim() ||
        !dto.specialization?.trim()
      ) {
        throw new BusinessRuleViolationException(
          'name, designation and specialization are required when registering as doctor',
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

    const bcryptRounds =
      this.configService.get<number>('auth.bcryptRounds') ?? 12;
    const passwordHash = (await bcrypt.hash(
      dto.password,
      bcryptRounds,
    )) as string;

    const createAccountDto: CreateAccountDto = {
      loginType,
      loginValue,
      passwordHash,
      isActive: true,
      roles: [{ roleId: role.id }],
    };

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const account = await this.accountRepo.create(createAccountDto, session);

      const address = await this.addressService.create(
        {
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
        },
        session,
      );

      if (dto.registrationType === 'hospital') {
        await this.hospitalService.create(
          {
            accountId: account.id,
            addressId: address.id,
            name: dto.name,
            slug: generateSlugFromName(dto.name),
            phone: dto.phone,
            email: dto.email,
            coverPhotoUrl: dto.coverPhotoUrl ?? null,
          },
          session,
        );
      } else {
        await this.doctorProfileService.create(
          {
            fullName: dto.name.trim(),
            designation: (dto.designation as string).trim(),
            specialization: (dto.specialization as string).trim(),
            phone: dto.phone,
            email: dto.email,
            addressId: address.id,
            accountId: account.id,
            slug: generateSlugFromName(dto.name),
            bio: dto.bio ?? null,
            profilePhotoUrl: dto.profilePhotoUrl ?? null,
            createdBy: null,
            hospitalId: null,
          },
          session,
        );
      }

      await session.commitTransaction();
      this.logger.log(
        `Registered account ${account.id} as ${dto.registrationType} (${loginType}:${loginValue})`,
      );
      return this.signAndReturnAuthResponse(account.id, loginType, loginValue);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
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

    const bcryptRounds =
      this.configService.get<number>('auth.bcryptRounds') ?? 12;
    const passwordHash = (await bcrypt.hash(
      dto.password,
      bcryptRounds,
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
      slug: generateSlugFromName(dto.fullName),
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
