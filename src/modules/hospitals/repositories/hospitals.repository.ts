import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types, FilterQuery } from 'mongoose';
import { HospitalDocument } from '../schemas';
import { HospitalEntity } from '../entities';
import { HospitalMapper } from '../mappers';
import type { IHospitalRepository, CreateHospitalInput } from '../interfaces';
import {
  HospitalsQuery,
  PaginatedHospitals,
} from '../interfaces/hospital-service.interface';

@Injectable()
export class HospitalsRepository implements IHospitalRepository {
  constructor(
    @InjectModel('Hospital')
    private readonly hospitalModel: Model<HospitalDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

  async findById(id: string): Promise<HospitalEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.hospitalModel
      .findOne({ _id: new Types.ObjectId(id), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? HospitalMapper.toDomain(doc) : null;
  }

  async findByAccountId(accountId: string): Promise<HospitalEntity | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;
    const doc = await this.hospitalModel
      .findOne({ accountId: new Types.ObjectId(accountId), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? HospitalMapper.toDomain(doc) : null;
  }

  async create(
    data: CreateHospitalInput,
    session?: ClientSession,
  ): Promise<HospitalEntity> {
    const options = session ? { session } : {};
    const [doc] = await this.hospitalModel.create(
      [
        {
          accountId: new Types.ObjectId(data.accountId),
          addressId:
            data.addressId != null ? new Types.ObjectId(data.addressId) : null,
          name: data.name,
          slug: data.slug,
          phone: data.phone,
          email: data.email,
          coverPhotoUrl: data.coverPhotoUrl ?? null,
          isActive: true,
          deletedAt: null,
        },
      ],
      options,
    );
    return HospitalMapper.toDomain(doc);
  }

  async findHospitals(query: HospitalsQuery): Promise<PaginatedHospitals> {
    const {
      page,
      limit,
      search,
      name,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<HospitalDocument> = { ...this.notDeleted };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const [docs, total] = await Promise.all([
      this.hospitalModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.hospitalModel.countDocuments(filter).exec(),
    ]);

    return {
      hospitals: docs.map((doc) => HospitalMapper.toDomain(doc)),
      total,
      page,
      limit,
    };
  }

  async updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<HospitalEntity | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;
    const doc = await this.hospitalModel
      .findOneAndUpdate(
        { accountId: new Types.ObjectId(accountId), ...this.notDeleted },
        { $set: { email: email.toLowerCase().trim(), updatedAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    return doc ? HospitalMapper.toDomain(doc) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<CreateHospitalInput, 'accountId'>>,
    session?: ClientSession,
  ): Promise<HospitalEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const op = session ? { session, new: true } : { new: true };
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle string to ObjectId conversion for addressId
    if (data.addressId !== undefined) {
      updateData['addressId'] =
        data.addressId != null ? new Types.ObjectId(data.addressId) : null;
    }

    const doc = await this.hospitalModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...this.notDeleted },
        { $set: updateData },
        op,
      )
      .lean()
      .exec();

    return doc ? HospitalMapper.toDomain(doc) : null;
  }
}
