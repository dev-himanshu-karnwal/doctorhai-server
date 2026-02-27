import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { HospitalDocument } from '../schemas';
import { HospitalEntity } from '../entities';
import { HospitalMapper } from '../mappers';
import type { IHospitalRepository, CreateHospitalInput } from '../interfaces';

@Injectable()
export class HospitalsRepository implements IHospitalRepository {
  constructor(
    @InjectModel('Hospital')
    private readonly hospitalModel: Model<HospitalDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

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
          addressId: new Types.ObjectId(data.addressId),
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
}
