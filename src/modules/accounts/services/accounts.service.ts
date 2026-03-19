import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  HOSPITAL_REPOSITORY_TOKEN,
  ADDRESS_REPOSITORY_TOKEN,
  DOCTOR_STATUS_REPOSITORY_TOKEN,
} from '../../../common/constants';
import type {
  IAccountService,
  PaginatedAccountsResponse,
  DetailedAccountResponse,
} from '../interfaces/account-service.interface';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import { AccountEntity } from '../../auth/entities';
import type { AccountsQueryDto } from '../dto/accounts-query.dto';
import type { IDoctorProfileRepository } from '../../doctor-profiles/interfaces';
import type { IHospitalRepository } from '../../hospitals/interfaces';
import type { IAddressRepository } from '../../addresses/interfaces';
import type { IDoctorStatusRepository } from '../../doctor-statuses/interfaces';
import { DoctorProfileEntity } from '../../doctor-profiles/entities';
import { HospitalEntity } from '../../hospitals/entities';
import { AddressEntity } from '../../addresses/entities';

@Injectable()
export class AccountsService implements IAccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorRepo: IDoctorProfileRepository,
    @Inject(HOSPITAL_REPOSITORY_TOKEN)
    private readonly hospitalRepo: IHospitalRepository,
    @Inject(ADDRESS_REPOSITORY_TOKEN)
    private readonly addressRepo: IAddressRepository,
    @Inject(DOCTOR_STATUS_REPOSITORY_TOKEN)
    private readonly doctorStatusRepo: IDoctorStatusRepository,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async getAccounts(
    query: AccountsQueryDto,
  ): Promise<PaginatedAccountsResponse> {
    const result = await this.accountRepo.findAccounts(query);

    return {
      paginatedmetadata: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
      account: result.items,
    };
  }

  async getAccountById(id: string): Promise<DetailedAccountResponse> {
    const account: AccountEntity | null = await this.accountRepo.findById(id);
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    const response: DetailedAccountResponse = {
      id: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
      isActive: account.isActive,
      isVerified: account.isVerified,
      roles: account.roles.map((r) => ({
        roleId: r.roleId,
        grantedBy: r.grantedBy,
        grantedAt: r.grantedAt,
      })),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };

    // Try to find doctor profile
    const doctor: DoctorProfileEntity | null =
      await this.doctorRepo.findByAccountId(id);
    if (doctor) {
      response.doctor = {
        id: doctor.id,
        fullName: doctor.fullName,
        designation: doctor.designation,
        specialization: doctor.specialization,
        phone: doctor.phone,
        email: doctor.email,
        slug: doctor.slug,
        profilePhotoUrl: doctor.profilePhotoUrl,
      };

      if (doctor.addressId) {
        const doctorAddr: AddressEntity | null =
          await this.addressRepo.findById(doctor.addressId);
        if (doctorAddr) {
          response.address = {
            id: String(doctorAddr.id),
            addressLine1: String(doctorAddr.addressLine1),
            addressLine2: doctorAddr.addressLine2,
            city: String(doctorAddr.city),
            state: String(doctorAddr.state),
            pincode: String(doctorAddr.pincode),
            latitude: doctorAddr.latitude,
            longitude: doctorAddr.longitude,
          };
        }
      }
    } else {
      // Try to find hospital profile if not a doctor
      const hospital: HospitalEntity | null =
        await this.hospitalRepo.findByAccountId(id);
      if (hospital) {
        response.hospital = {
          id: hospital.id,
          name: hospital.name,
          slug: hospital.slug,
          phone: hospital.phone,
          email: hospital.email,
          coverPhotoUrl: hospital.coverPhotoUrl,
          isActive: hospital.isActive,
          type: hospital.type ? String(hospital.type) : null,
        };

        if (hospital.addressId) {
          const hospAddr: AddressEntity | null =
            await this.addressRepo.findById(hospital.addressId);
          if (hospAddr) {
            response.address = {
              id: String(hospAddr.id),
              addressLine1: String(hospAddr.addressLine1),
              addressLine2: hospAddr.addressLine2,
              city: String(hospAddr.city),
              state: String(hospAddr.state),
              pincode: String(hospAddr.pincode),
              latitude: hospAddr.latitude,
              longitude: hospAddr.longitude,
            };
          }
        }
      }
    }

    return response;
  }

  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
  ): Promise<AccountEntity> {
    const updatedAccount = await this.accountRepo.updateVerificationStatus(
      id,
      isVerified,
    );

    if (!updatedAccount) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    const account = await this.accountRepo.findById(id);
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Handle Hospital deletion
      const hospital = await this.hospitalRepo.findByAccountId(id);
      if (hospital) {
        // Find all doctors belonging to this hospital
        const hospitalDoctors = await this.doctorRepo.findByHospitalId(
          hospital.id,
        );
        for (const doctor of hospitalDoctors) {
          // Delete each doctor's status
          await this.doctorStatusRepo.deleteByDoctorProfileId(
            doctor.id,
            session,
          );
          // Delete each doctor's address if exists
          if (doctor.addressId) {
            await this.addressRepo.delete(doctor.addressId, session);
          }
          // Delete the doctor profile itself
          await this.doctorRepo.delete(doctor.id, session);
        }
        // Delete hospital's address
        if (hospital.addressId) {
          await this.addressRepo.delete(hospital.addressId, session);
        }
        // Delete hospital profile
        await this.hospitalRepo.delete(hospital.id, session);
      }

      // 2. Handle Individual Doctor deletion (if not already handled or if it's a standalone doctor account)
      const doctor = await this.doctorRepo.findByAccountId(id);
      if (doctor) {
        // Delete doctor status
        await this.doctorStatusRepo.deleteByDoctorProfileId(doctor.id, session);
        // Delete doctor address
        if (doctor.addressId) {
          await this.addressRepo.delete(doctor.addressId, session);
        }
        // Delete doctor profile
        await this.doctorRepo.delete(doctor.id, session);
      }

      // 3. Finally delete the account itself
      await this.accountRepo.delete(id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
