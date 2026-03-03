import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  ROLE_SERVICE_TOKEN,
  PERMISSION_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IPermissionService } from '../interfaces/permission-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { MeResponseDto } from '../dto';
import { DoctorMeDto, HospitalMeDto } from '../dto/me-response.dto';

@Injectable()
export class AuthMeService {
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
  ) {}

  async getMe(accountId: string): Promise<MeResponseDto> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const roleIds = account.roles.map((a) => a.roleId);
    const roles = await this.roleService.findByIds(roleIds);
    const roleNames = roles.map((r) => r.name);

    const accountMe = {
      id: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
      roles: roleNames,
      isActive: account.isActive,
      isVerified: account.isVerified,
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

    const roleIds = account.roles.map((a) => a.roleId);
    const roles = await this.roleService.findByIds(roleIds);

    const permissionIds = new Set<string>();
    for (const role of roles) {
      for (const permissionId of role.permissions) {
        permissionIds.add(permissionId);
      }
    }

    const permissions = await this.permissionService.findByIds([
      ...permissionIds,
    ]);
    return permissions.map((p) => p.key);
  }
}
