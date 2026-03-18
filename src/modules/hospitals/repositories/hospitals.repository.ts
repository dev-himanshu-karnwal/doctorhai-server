import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Model,
  Types,
  FilterQuery,
  PipelineStage,
} from 'mongoose';
import { HospitalDocument } from '../schemas';
import { HospitalEntity } from '../entities';
import { HospitalMapper } from '../mappers';
import {
  IHospitalRepository,
  CreateHospitalInput,
  HospitalStats,
} from '../interfaces';
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
          public_view_count: 0,
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
      isVerified,
      isAvailable,
      specialities,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<HospitalDocument> = { ...this.notDeleted };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: '$account' },
      {
        $addFields: {
          isVerified: '$account.isVerified',
        },
      },
    ];

    if (isVerified !== undefined) {
      pipeline.push({
        $match: { isVerified: isVerified === 'true' },
      });
    }

    // Join with addresses based on addressId
    pipeline.push(
      {
        $lookup: {
          from: 'addresses',
          localField: 'addressId',
          foreignField: '_id',
          as: 'address',
        },
      },
      {
        $unwind: { path: '$address', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          location: {
            $cond: [
              { $ifNull: ['$address', false] },
              {
                latitude: { $ifNull: ['$address.latitude', null] },
                longitude: { $ifNull: ['$address.longitude', null] },
              },
              '$location',
            ],
          },
        },
      },
    );

    // Filter by city/state
    if (query.city) {
      pipeline.push({
        $match: {
          'address.city': { $regex: query.city.trim(), $options: 'i' },
        },
      });
    }

    if (query.state) {
      pipeline.push({
        $match: {
          'address.state': { $regex: query.state.trim(), $options: 'i' },
        },
      });
    }

    pipeline.push({
      $lookup: {
        from: 'doctor_profiles',
        localField: '_id',
        foreignField: 'hospitalId',
        as: 'doctors',
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } },
            { 'doctors.specialization': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    if (isAvailable !== undefined) {
      pipeline.push(
        {
          $lookup: {
            from: 'doctor_statuses',
            localField: 'doctors._id',
            foreignField: 'doctorProfileId',
            as: 'doctorStatuses',
          },
        },
        {
          $match: {
            'doctorStatuses.status':
              isAvailable === 'true' ? 'available' : { $nin: ['available'] },
          },
        },
      );
    }

    if (specialities && specialities.length > 0) {
      pipeline.push({
        $match: {
          'doctors.specialization': { $in: specialities },
        },
      });
    }

    // Filter by doctor experience
    if (query.experience && query.experience.length > 0) {
      const expValue = parseInt(query.experience[0], 10);
      if (!isNaN(expValue)) {
        pipeline.push({
          $addFields: {
            maxExp: {
              $max: {
                $map: {
                  input: '$doctors',
                  as: 'doc',
                  in: {
                    $toInt: {
                      $ifNull: [
                        {
                          $let: {
                            vars: {
                              found: {
                                $regexFind: {
                                  input: {
                                    $ifNull: ['$$doc.hasExperience', '0'],
                                  },
                                  regex: '[0-9]+',
                                },
                              },
                            },
                            in: { $ifNull: ['$$found.match', '0'] },
                          },
                        },
                        '0',
                      ],
                    },
                  },
                },
              },
            },
          },
        });
        pipeline.push({
          $match: {
            maxExp: { $gte: expValue },
          },
        });
      }
    }

    const sortStage: PipelineStage.Sort = {
      $sort: {
        [sortBy === 'createdAt' ? 'createdAt' : sortBy]:
          sortOrder === 'asc' ? 1 : -1,
      },
    };

    const [result] = await this.hospitalModel
      .aggregate<{
        data: HospitalDocument[];
        total: { count: number }[];
      }>([
        ...pipeline,
        {
          $facet: {
            data: [sortStage, { $skip: skip }, { $limit: limit }],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .exec();

    const docs = result?.data ?? [];
    const total = result?.total?.[0]?.count ?? 0;

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
  async incrementViewCount(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.hospitalModel
      .findByIdAndUpdate(id, { $inc: { public_view_count: 1 } })
      .exec();
  }

  async getStats(): Promise<HospitalStats> {
    const statsResult = await this.hospitalModel
      .aggregate<HospitalStats>([
        { $match: { deletedAt: null } },
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account',
          },
        },
        { $unwind: '$account' },
        {
          $group: {
            _id: null,
            total_hospital_count: { $sum: 1 },
            total_verified_count: {
              $sum: { $cond: [{ $eq: ['$account.isVerified', true] }, 1, 0] },
            },
            total_unverified_count: {
              $sum: { $cond: [{ $eq: ['$account.isVerified', false] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total_hospital_count: 1,
            total_verified_count: 1,
            total_unverified_count: 1,
          },
        },
      ])
      .exec();

    return (
      statsResult[0] || {
        total_hospital_count: 0,
        total_verified_count: 0,
        total_unverified_count: 0,
      }
    );
  }

  async findByAddressId(addressId: string): Promise<HospitalEntity | null> {
    if (!Types.ObjectId.isValid(addressId)) return null;
    const doc = await this.hospitalModel
      .findOne({ addressId: new Types.ObjectId(addressId), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? HospitalMapper.toDomain(doc) : null;
  }

  async delete(id: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    const options = session ? { session } : {};
    await this.hospitalModel.findByIdAndDelete(id, options).exec();
  }
}
