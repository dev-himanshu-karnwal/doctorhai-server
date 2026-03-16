import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ACCOUNT_SERVICE_TOKEN,
  ADDRESS_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
} from '../../../common/constants';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { ClientSession } from 'mongoose';
import type { IAddressRepository, IAddressService } from '../interfaces';
import type { CreateAddressInput, UpdateAddressInput } from '../interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
import { DoctorProfileEntity } from '../../doctor-profiles/entities';
import { HospitalEntity } from '../../hospitals/entities';
import { AddressEntity } from '../entities';

@Injectable()
export class AddressesService implements IAddressService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @Inject(ADDRESS_REPOSITORY_TOKEN)
    private readonly addressRepo: IAddressRepository,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
  ) {}

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IAddressService['findById']>>> {
    this.logger.debug(`Finding address by id: ${id}`);
    const entity = await this.addressRepo.findById(id);
    if (!entity) throw new ResourceNotFoundException('Address', id);
    return entity;
  }

  async create(
    data: CreateAddressInput,
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IAddressService['create']>>> {
    this.logger.debug('Creating address');
    return this.addressRepo.create(data, session);
  }

  async update(
    id: string,
    data: Parameters<IAddressService['update']>[1],
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IAddressService['update']>>> {
    this.logger.debug(`Updating address by id: ${id}`);
    const updated = await this.addressRepo.update(id, data, session);
    if (!updated) throw new ResourceNotFoundException('Address', id);
    return updated;
  }

  async findByIdWithPermission(
    id: string,
    requesterAccountId: string,
  ): Promise<AddressEntity> {
    await this.checkPermission(id, requesterAccountId, 'view');
    return this.findById(id);
  }

  async updateWithPermission(
    id: string,
    data: UpdateAddressInput,
    requesterAccountId: string,
  ): Promise<AddressEntity> {
    await this.checkPermission(id, requesterAccountId, 'update');
    return (await this.update(id, data)) as AddressEntity;
  }

  async upsertByAccount(
    targetAccountId: string,
    requesterAccountId: string,
    data: UpdateAddressInput,
  ): Promise<AddressEntity> {
    this.logger.debug(
      `Upserting address for target account: ${targetAccountId} by requester: ${requesterAccountId}`,
    );

    // 1. Identify the profile resiliently
    const profile = await this.findProfileResiliently(targetAccountId);
    if (!profile) {
      throw new ResourceNotFoundException('Profile', targetAccountId);
    }

    // 2. Authorization Check (use the actual accountId from the profile)
    await this.checkAccountPermission(profile.accountId, requesterAccountId);

    let addressId = 'addressId' in profile ? profile.addressId : null;

    // AUTOMATIC RECOVERY: If profile has no link, check if an address already exists for this account
    if (!addressId) {
      const existingAddress = await this.addressRepo.findByAccountId(
        profile.accountId,
      );
      if (existingAddress) {
        this.logger.debug(
          `Automatically recovered address ${existingAddress.id} for account ${profile.accountId}`,
        );
        addressId = existingAddress.id;
        // Link it to profile
        if (profile instanceof DoctorProfileEntity) {
          await this.doctorProfileService.updateAddressId(
            profile.id,
            addressId,
          );
        } else if (profile instanceof HospitalEntity) {
          await this.hospitalService.updateAddressId(profile.id, addressId);
        }
      }
    }

    // MANUAL RECOVERY: Fallback if automatic recovery missed it but user provided it
    if (!addressId && data.addressId) {
      this.logger.debug(
        `Recovering orphaned address ${data.addressId} for account ${profile.accountId}`,
      );
      // Verify the address exists
      const existingAddress = await this.addressRepo.findById(data.addressId);
      if (existingAddress) {
        // If the address already belongs to another account, we should probably be careful,
        // but for now let's assume if it's orphaned (no accountId) or user has it, it's fine.
        if (
          !existingAddress.accountId ||
          existingAddress.accountId === profile.accountId
        ) {
          addressId = data.addressId;
          // Step 1: Stamp it with our accountId if it's missing (migration)
          if (!existingAddress.accountId) {
            await this.addressRepo.update(addressId, {
              accountId: profile.accountId,
            });
          }
          // Step 2: Link it to profile
          if (profile instanceof DoctorProfileEntity) {
            await this.doctorProfileService.updateAddressId(
              profile.id,
              addressId,
            );
          } else if (profile instanceof HospitalEntity) {
            await this.hospitalService.updateAddressId(profile.id, addressId);
          }
        }
      }
    }

    if (addressId) {
      // UPDATE MODE
      // If we are in update mode, we just need the coordinates at minimum,
      // but if the user provided line1/etc, that's fine too.
      // The requirement was: during update latitude/longitude are only required.
      if (data.latitude === undefined || data.longitude === undefined) {
        throw new BadRequestException(
          'latitude and longitude are required for updating an address',
        );
      }
      return (await this.update(addressId, data)) as AddressEntity;
    } else {
      // CREATE MODE
      // BUT WAIT: Check if the user passed an addressId in the body to "re-link"
      // (This is already handled by the recovery logic above, but let's be extra sure)
      // CREATE MODE
      const requiredFields = [
        'addressLine1',
        'city',
        'state',
        'pincode',
        'latitude',
        'longitude',
      ];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new BadRequestException(
            `${field} is required for creating a new address`,
          );
        }
      }

      const newAddress = await this.addressRepo.create({
        addressLine1: data.addressLine1!,
        addressLine2: data.addressLine2,
        city: data.city!,
        state: data.state!,
        pincode: data.pincode!,
        latitude: data.latitude,
        longitude: data.longitude,
        accountId: profile.accountId,
      });

      // Link to profile
      if (profile instanceof DoctorProfileEntity) {
        await this.doctorProfileService.updateAddressId(
          profile.id,
          newAddress.id,
        );
      } else if (profile instanceof HospitalEntity) {
        await this.hospitalService.updateAddressId(profile.id, newAddress.id);
      }

      return newAddress;
    }
  }

  private async findProfileResiliently(
    id: string,
  ): Promise<DoctorProfileEntity | HospitalEntity | null> {
    // Try Doctor by accountId then by id
    const doctorByAcc = await this.doctorProfileService.findByAccountId(id);
    if (doctorByAcc) return doctorByAcc;
    const doctorById = await this.doctorProfileService.findById(id);
    if (doctorById) return doctorById;

    // Try Hospital by accountId then by id
    const hospitalByAcc = await this.hospitalService.findByAccountId(id);
    if (hospitalByAcc) return hospitalByAcc;
    const hospitalById = await this.hospitalService.findById(id);
    if (hospitalById) return hospitalById;

    return null;
  }

  private async checkAccountPermission(
    targetAccountId: string,
    requesterAccountId: string,
  ): Promise<void> {
    if (targetAccountId === requesterAccountId) return;

    const requesterAccount =
      await this.accountService.findById(requesterAccountId);
    const roleNames: string[] = [];
    for (const assignment of requesterAccount.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    if (isSuperAdmin) return;

    const isHospital = roleNames.includes('hospital');
    if (isHospital) {
      const hospital =
        await this.hospitalService.findByAccountId(requesterAccountId);
      if (!hospital) throw new ForbiddenException('Hospital profile not found');

      // Check if target is a doctor connected to this hospital
      const targetDoctor =
        await this.doctorProfileService.findByAccountId(targetAccountId);
      if (targetDoctor?.hospitalId === hospital.id) return;
    }

    throw new ForbiddenException(
      'You are not authorized to manage address for this account',
    );
  }

  private async checkPermission(
    addressId: string,
    requesterAccountId: string,
    action: 'view' | 'update',
  ): Promise<void> {
    const account = await this.accountService.findById(requesterAccountId);
    const roleNames: string[] = [];
    for (const assignment of account.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    const isHospital = roleNames.includes('hospital');
    const isDoctor = roleNames.includes('doctor');

    if (isSuperAdmin) return;

    if (isHospital) {
      const requesterHospital =
        await this.hospitalService.findByAccountId(requesterAccountId);
      if (!requesterHospital)
        throw new ForbiddenException('Hospital profile not found');

      const hospitalWithAddress =
        await this.hospitalService.findByAddressId(addressId);
      if (hospitalWithAddress?.id === requesterHospital.id) return;

      const doctorWithAddress =
        await this.doctorProfileService.findByAddressId(addressId);
      if (doctorWithAddress?.hospitalId === requesterHospital.id) return;

      throw new ForbiddenException(
        `You are not authorized to ${action} this address`,
      );
    }

    if (isDoctor) {
      const requesterDoctor =
        await this.doctorProfileService.findByAccountId(requesterAccountId);
      if (!requesterDoctor)
        throw new ForbiddenException('Doctor profile not found');

      const doctorWithAddress =
        await this.doctorProfileService.findByAddressId(addressId);
      if (doctorWithAddress?.id === requesterDoctor.id) return;

      throw new ForbiddenException(
        `You are not authorized to ${action} this address`,
      );
    }

    throw new ForbiddenException('Forbidden');
  }
}
