import {
  Injectable,
  Logger,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AppConfigService } from '../../../config';
import { InjectConnection } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Connection } from 'mongoose';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  PERMISSION_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
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
import type { IPermissionService } from '../interfaces/permission-service.interface';
import type { IAccountCreationService } from '../interfaces/account-creation-service.interface';
import type { IAuthFlowService } from '../interfaces/auth-flow-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
  MeResponseDto,
} from '../dto';
import type { CreateAccountDto } from '../dto';
import type { AccountEntity } from '../entities';
import type { RegistrationType } from '../enums/registration-type.enum';
import { DoctorMeDto, HospitalMeDto } from '../dto/me-response.dto';

@Injectable()
export class AuthFlowService implements IAuthFlowService {
  private readonly logger = new Logger(AuthFlowService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    @Inject(PERMISSION_SERVICE_TOKEN)
    private readonly permissionService: IPermissionService,
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
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

  async getMe(accountId: string): Promise<MeResponseDto> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }
    const roleNames: string[] = [];
    for (const assignment of account.roles) {
      try {
        const role = await this.roleService.findById(assignment.roleId);
        roleNames.push(role.name);
      } catch {
        // Skip roles that no longer exist
      }
    }

    const accountMe = {
      id: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
      roles: roleNames,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };

    const result: MeResponseDto = { account: accountMe };

    if (roleNames.includes('hospital')) {
      const hospital = await this.hospitalService.findByAccountId(accountId);
      if (hospital) {
        const hospitalMe: HospitalMeDto = {
          id: hospital.id,
          name: hospital.name,
          slug: hospital.slug,
          phone: hospital.phone,
          email: hospital.email,
          coverPhotoUrl: hospital.coverPhotoUrl,
          isActive: hospital.isActive,
          createdAt: hospital.createdAt,
          updatedAt: hospital.updatedAt,
        };

        if (hospital.addressId) {
          const address = await this.addressService.findById(
            hospital.addressId,
          );
          hospitalMe.address = {
            id: address.id,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
          };
        }

        result.hospital = hospitalMe;
      }
    }

    if (roleNames.includes('doctor')) {
      const doctor = await this.doctorProfileService.findByAccountId(accountId);
      if (doctor) {
        const doctorMe: DoctorMeDto = {
          id: doctor.id,
          fullName: doctor.fullName,
          designation: doctor.designation,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
          slug: doctor.slug,
          bio: doctor.bio,
          profilePhotoUrl: doctor.profilePhotoUrl,
          hospitalId: doctor.hospitalId,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt,
        };

        if (doctor.addressId) {
          const address = await this.addressService.findById(doctor.addressId);
          doctorMe.address = {
            id: address.id,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
          };
        }

        result.doctor = doctorMe;
      }
    }

    return result;
  }

  async getPermissionKeysForAccount(accountId: string): Promise<string[]> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      return [];
    }

    const permissionIds = new Set<string>();
    for (const assignment of account.roles) {
      try {
        const role = await this.roleService.findById(assignment.roleId);
        for (const permissionId of role.permissions) {
          permissionIds.add(permissionId);
        }
      } catch {
        // Skip roles that no longer exist
      }
    }

    const keys: string[] = [];
    for (const id of permissionIds) {
      try {
        const permission = await this.permissionService.findById(id);
        keys.push(permission.key);
      } catch {
        // Skip permissions that no longer exist
      }
    }
    return keys;
  }

  private static readonly UPDATE_OWN_EMAIL_PERMISSIONS = [
    'doctor.self.profile.update',
    'hospital.manage',
    'super_admin.manage',
  ] as const;

  private static readonly UPDATE_ANY_ACCOUNT_EMAIL_PERMISSION =
    'super_admin.manage' as const;

  async updateEmail(
    requestedByAccountId: string,
    targetAccountId: string,
    newEmail: string,
  ): Promise<void> {
    const permissions =
      await this.getPermissionKeysForAccount(requestedByAccountId);

    if (targetAccountId !== requestedByAccountId) {
      if (
        !permissions.includes(
          AuthFlowService.UPDATE_ANY_ACCOUNT_EMAIL_PERMISSION,
        )
      ) {
        throw new ForbiddenException(
          'Only superadmin can update another account email',
        );
      }
    } else {
      const hasOwnPermission =
        AuthFlowService.UPDATE_OWN_EMAIL_PERMISSIONS.some((p) =>
          permissions.includes(p),
        );
      if (!hasOwnPermission) {
        throw new ForbiddenException(
          'Insufficient permissions to update email',
        );
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
      const existing = await this.accountRepo.findOneByLogin(
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
