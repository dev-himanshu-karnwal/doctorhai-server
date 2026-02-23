import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DoctorProfileDocument } from '../schemas';
import { DoctorProfileEntity } from '../entities';
import { DoctorProfileMapper } from '../mappers';
import type {
  IDoctorProfileRepository,
  CreateDoctorProfileInput,
} from '../interfaces';

@Injectable()
export class DoctorProfilesRepository implements IDoctorProfileRepository {
  constructor(
    @InjectModel('DoctorProfile')
    private readonly doctorProfileModel: Model<DoctorProfileDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

  async findByAccountId(
    accountId: string,
  ): Promise<DoctorProfileEntity | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;
    const doc = await this.doctorProfileModel
      .findOne({ accountId: new Types.ObjectId(accountId), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }

  async create(data: CreateDoctorProfileInput): Promise<DoctorProfileEntity> {
    const [doc] = await this.doctorProfileModel.create([
      {
        fullName: data.fullName,
        designation: data.designation,
        specialization: data.specialization,
        phone: data.phone,
        email: data.email,
        addressId: new Types.ObjectId(data.addressId),
        accountId: new Types.ObjectId(data.accountId),
        slug: data.slug,
        bio: data.bio ?? null,
        profilePhotoUrl: data.profilePhotoUrl ?? null,
        createdBy:
          data.createdBy != null ? new Types.ObjectId(data.createdBy) : null,
        hospitalId:
          data.hospitalId != null ? new Types.ObjectId(data.hospitalId) : null,
        deletedAt: null,
      },
    ]);
    return DoctorProfileMapper.toDomain(doc);
  }
}
