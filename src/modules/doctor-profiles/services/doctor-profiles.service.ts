import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  DOCTOR_PROFILE_REPOSITORY_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  ADDRESS_SERVICE_TOKEN,
} from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import { generateSlugFromName } from '../../../common/utils';
import type { IAccountCreationService } from '../../auth/interfaces/account-creation-service.interface';
import type { IAddressService } from '../../addresses/interfaces';
import type { ClientSession } from 'mongoose';
import type {
  IDoctorProfileRepository,
  IDoctorProfileService,
  CreateDoctorProfileData,
} from '../interfaces';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';

@Injectable()
export class DoctorProfilesService implements IDoctorProfileService {
  private readonly logger = new Logger(DoctorProfilesService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_REPOSITORY_TOKEN)
    private readonly doctorProfileRepo: IDoctorProfileRepository,
    @Inject(ACCOUNT_CREATION_SERVICE_TOKEN)
    private readonly accountCreationService: IAccountCreationService,
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
  ) {}

  async findByAccountId(
    accountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['findByAccountId']>>> {
    this.logger.debug(`Finding doctor profile by accountId: ${accountId}`);
    return this.doctorProfileRepo.findByAccountId(accountId);
  }

  async findByEmailAndHospitalId(
    email: string,
    hospitalId: string | null,
  ): Promise<
    Awaited<ReturnType<IDoctorProfileService['findByEmailAndHospitalId']>>
  > {
    this.logger.debug(
      `Finding doctor profile by email and hospitalId: ${email}, ${hospitalId ?? 'individual'}`,
    );
    return this.doctorProfileRepo.findByEmailAndHospitalId(email, hospitalId);
  }

  async create(
    data: CreateDoctorProfileData,
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['create']>>> {
    this.logger.debug(`Creating doctor profile for account: ${data.accountId}`);
    return this.doctorProfileRepo.create(data, session);
  }

  async createByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileService['createByHospital']>>> {
    if (
      await this.doctorProfileRepo.findByEmailAndHospitalId(
        dto.email,
        dto.hospitalId,
      )
    ) {
      throw new BusinessRuleViolationException(
        `Email '${dto.email}' is already used for a doctor profile at this hospital`,
      );
    }

    const account = await this.accountCreationService.createUsernameAccount(
      dto.username,
      dto.password,
      'doctor',
    );

    const address = await this.addressService.create({
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    const doctor = await this.doctorProfileRepo.create({
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

    return doctor;
  }
}
