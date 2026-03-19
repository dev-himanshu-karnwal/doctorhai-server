import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FilterQuery,
  Model,
  PipelineStage,
  Types,
} from 'mongoose';
import { DoctorProfileDocument } from '../schemas';
import { DoctorProfileEntity } from '../entities';
import { DoctorProfileMapper } from '../mappers';
import type {
  IDoctorProfileRepository,
  CreateDoctorProfileInput,
  UpdateDoctorProfileInput,
  DoctorStats,
} from '../interfaces';
import type {
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces/doctor-profile-service.interface';
import { buildSort } from '../../../common/mongoose/query-helpers';

@Injectable()
export class DoctorProfilesRepository implements IDoctorProfileRepository {
  constructor(
    @InjectModel('DoctorProfile')
    private readonly doctorProfileModel: Model<DoctorProfileDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IDoctorProfileRepository['findById']>>> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.doctorProfileModel.findById(id).exec();
    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }

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

  async findByEmailAndHospitalId(
    email: string,
    hospitalId: string | null,
  ): Promise<DoctorProfileEntity | null> {
    const query: Record<string, unknown> = {
      email: email.toLowerCase().trim(),
      ...this.notDeleted,
    };
    query.hospitalId =
      hospitalId != null && Types.ObjectId.isValid(hospitalId)
        ? new Types.ObjectId(hospitalId)
        : null;
    const doc = await this.doctorProfileModel.findOne(query).lean().exec();
    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }

  async create(
    data: CreateDoctorProfileInput,
    session?: ClientSession,
  ): Promise<DoctorProfileEntity> {
    const options = session ? { session } : {};
    const [doc] = await this.doctorProfileModel.create(
      [
        {
          fullName: data.fullName,
          designation: data.designation ?? null,
          specialization: data.specialization ?? null,
          phone: data.phone,
          email: data.email,
          addressId:
            data.addressId != null ? new Types.ObjectId(data.addressId) : null,
          accountId: new Types.ObjectId(data.accountId),
          slug: data.slug,
          bio: data.bio ?? null,
          profilePhotoUrl: data.profilePhotoUrl ?? null,
          createdBy:
            data.createdBy != null ? new Types.ObjectId(data.createdBy) : null,
          hospitalId:
            data.hospitalId != null
              ? new Types.ObjectId(data.hospitalId)
              : null,
          deletedAt: null,
          public_view_count: 0,
        },
      ],
      options,
    );
    return DoctorProfileMapper.toDomain(doc);
  }

  async findDoctors(query: DoctorsQuery): Promise<PaginatedDoctorProfiles> {
    const baseFilter: FilterQuery<DoctorProfileDocument> = {
      ...this.notDeleted,
    };

    if (query.hospitalId) {
      const hospitalIdStr = String(query.hospitalId);

      const hospitalFilter = Types.ObjectId.isValid(hospitalIdStr)
        ? {
            $or: [
              { hospitalId: new Types.ObjectId(hospitalIdStr) },
              { hospitalId: hospitalIdStr },
            ],
          }
        : { hospitalId: hospitalIdStr };

      baseFilter.$and = [...(baseFilter.$and || []), hospitalFilter];
    }

    if (query.specialization != null && query.specialization.trim() !== '') {
      baseFilter.specialization = new RegExp(query.specialization.trim(), 'i');
    }

    if (query.designation != null && query.designation.trim() !== '') {
      baseFilter.designation = new RegExp(query.designation.trim(), 'i');
    }

    if (query.search != null && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      baseFilter.$or = [
        { fullName: searchRegex },
        { specialization: searchRegex },
        { designation: searchRegex },
        { email: searchRegex },
      ];
    }

    const sort = buildSort<NonNullable<DoctorsQuery['sortBy']>>(
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
      'fullName',
      ['fullName', 'createdAt', 'public_view_count'] as const,
    );

    const skip = (query.page - 1) * query.limit;

    // Build the aggregation pipeline to always join accounts and fetch isVerified
    const pipeline: PipelineStage[] = [
      { $match: baseFilter },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      {
        $unwind: {
          path: '$account',
          preserveNullAndEmptyArrays: true, // Handle doctors without accounts gracefully
        },
      },
      {
        $addFields: {
          isVerified: { $ifNull: ['$account.isVerified', false] },
        },
      },
    ];

    // If isVerified filter is provided, add it to the pipeline
    if (query.isVerified !== undefined) {
      const isVerifiedBool = String(query.isVerified).toLowerCase() === 'true';
      pipeline.push({
        $match: {
          isVerified: isVerifiedBool,
        },
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
          latitude: { $ifNull: ['$address.latitude', null] },
          longitude: { $ifNull: ['$address.longitude', null] },
        },
      },
    );

    if (query.lat != null && query.lng != null && query.distance != null) {
      pipeline.push({
        $addFields: {
          distanceInKm: {
            $cond: [
              {
                $and: [
                  { $ne: ['$latitude', null] },
                  { $ne: ['$longitude', null] },
                ],
              },
              {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $let: {
                        vars: {
                          lat1: { $degreesToRadians: query.lat },
                          lat2: { $degreesToRadians: '$latitude' },
                          lonDelta: {
                            $degreesToRadians: {
                              $subtract: ['$longitude', query.lng],
                            },
                          },
                        },
                        in: {
                          $add: [
                            {
                              $multiply: [
                                { $sin: '$$lat1' },
                                { $sin: '$$lat2' },
                              ],
                            },
                            {
                              $multiply: [
                                { $cos: '$$lat1' },
                                { $cos: '$$lat2' },
                                { $cos: '$$lonDelta' },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
              null,
            ],
          },
        },
      });

      pipeline.push({
        $match: {
          distanceInKm: { $lte: query.distance },
        },
      });
    }

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

    // Filter by availability
    if (query.isAvailable !== undefined) {
      pipeline.push(
        {
          $lookup: {
            from: 'doctor_statuses',
            localField: '_id',
            foreignField: 'doctorProfileId',
            as: 'status_info',
          },
        },
        {
          $match: {
            'status_info.status': query.isAvailable
              ? 'available'
              : { $nin: ['available'] },
          },
        },
      );
    }

    // Filter by specialities
    if (query.specialities && query.specialities.length > 0) {
      pipeline.push({
        $match: {
          specialization: { $in: query.specialities },
        },
      });
    }

    // Filter by experience
    if (query.experience && query.experience.length > 0) {
      const expValue = parseInt(query.experience[0], 10);
      if (!isNaN(expValue)) {
        pipeline.push({
          $match: {
            $expr: {
              $gte: [
                {
                  $toInt: {
                    $ifNull: [
                      {
                        $let: {
                          vars: {
                            found: {
                              $regexFind: {
                                input: { $ifNull: ['$hasExperience', '0'] },
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
                expValue,
              ],
            },
          },
        });
      }
    }

    // Run count and data fetch in parallel
    const [countResult, docs] = await Promise.all([
      this.doctorProfileModel.aggregate<{ total: number }>([
        ...pipeline,
        { $count: 'total' },
      ]),
      this.doctorProfileModel.aggregate([
        ...pipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: query.limit },
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      doctors: docs.map((doc) =>
        DoctorProfileMapper.toDomain(doc as DoctorProfileDocument),
      ),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async update(
    id: string,
    data: UpdateDoctorProfileInput,
  ): Promise<DoctorProfileEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updatePayload: Record<string, unknown> = {};
    if (data.fullName != null) updatePayload.fullName = data.fullName;
    if (data.designation !== undefined)
      updatePayload.designation = data.designation;
    if (data.specialization !== undefined)
      updatePayload.specialization = data.specialization;
    if (data.bio !== undefined) updatePayload.bio = data.bio;
    if (data.slug != null) updatePayload.slug = data.slug;
    if (data.hasExperience !== undefined)
      updatePayload.hasExperience = data.hasExperience;
    if (data.addressId !== undefined) {
      updatePayload.addressId =
        data.addressId != null ? new Types.ObjectId(data.addressId) : null;
    }

    if (Object.keys(updatePayload).length === 0) return this.findById(id);

    const doc = await this.doctorProfileModel
      .findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }

  async updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<DoctorProfileEntity | null> {
    if (!Types.ObjectId.isValid(accountId)) return null;
    const doc = await this.doctorProfileModel
      .findOneAndUpdate(
        { accountId: new Types.ObjectId(accountId), ...this.notDeleted },
        { $set: { email: email.toLowerCase().trim(), updatedAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }

  async findSpecializationsByHospitalIds(
    hospitalIds: string[],
  ): Promise<{ hospitalId: string; specialization: string }[]> {
    const validIds = hospitalIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => String(id));

    if (validIds.length === 0) return [];

    const results = (await this.doctorProfileModel
      .aggregate([
        {
          $match: {
            hospitalId: { $in: validIds },
            specialization: { $exists: true, $ne: null },
            ...this.notDeleted,
          },
        },
        {
          $project: {
            hospitalId: 1,
            specialization: 1,
          },
        },
      ])
      .exec()) as { hospitalId: Types.ObjectId; specialization: string }[];

    return results.map((res) => ({
      hospitalId: res.hospitalId.toString(),
      specialization: res.specialization,
    }));
  }
  async incrementViewCount(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.doctorProfileModel
      .findByIdAndUpdate(id, { $inc: { public_view_count: 1 } })
      .exec();
  }

  async getStats(hospitalId?: string): Promise<DoctorStats> {
    const matchStage: FilterQuery<DoctorProfileDocument> = { deletedAt: null };
    if (hospitalId && Types.ObjectId.isValid(hospitalId)) {
      matchStage.hospitalId = new Types.ObjectId(hospitalId);
    }

    const statsResult = await this.doctorProfileModel
      .aggregate<DoctorStats>([
        { $match: matchStage },
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account',
          },
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'doctor_statuses',
            localField: '_id',
            foreignField: 'doctorProfileId',
            as: 'status_info',
          },
        },
        { $unwind: { path: '$status_info', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            total_doctor_count: { $sum: 1 },
            total_verfied_count: {
              $sum: { $cond: [{ $eq: ['$account.isVerified', true] }, 1, 0] },
            },
            total_unverified_count: {
              $sum: {
                $cond: [
                  { $eq: [{ $ifNull: ['$account.isVerified', false] }, false] },
                  1,
                  0,
                ],
              },
            },
            total_available: {
              $sum: {
                $cond: [{ $eq: ['$status_info.status', 'available'] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total_doctor_count: 1,
            total_verfied_count: 1,
            total_unverified_count: 1,
            total_available: 1,
          },
        },
      ])
      .exec();

    return (
      statsResult[0] || {
        total_doctor_count: 0,
        total_verfied_count: 0,
        total_unverified_count: 0,
        total_available: 0,
      }
    );
  }
  async findByHospitalId(hospitalId: string): Promise<DoctorProfileEntity[]> {
    if (!Types.ObjectId.isValid(hospitalId)) return [];
    const docs = await this.doctorProfileModel
      .find({ hospitalId: new Types.ObjectId(hospitalId), ...this.notDeleted })
      .lean()
      .exec();
    return docs.map((doc) => DoctorProfileMapper.toDomain(doc));
  }

  async delete(id: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    const options = session ? { session } : {};
    await this.doctorProfileModel.findByIdAndDelete(id, options).exec();
  }

  async deleteByHospitalId(
    hospitalId: string,
    session?: ClientSession,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(hospitalId)) return;
    const options = session ? { session } : {};
    await this.doctorProfileModel
      .deleteMany({ hospitalId: new Types.ObjectId(hospitalId) }, options)
      .exec();
  }

  async findByAddressId(
    addressId: string,
  ): Promise<DoctorProfileEntity | null> {
    if (!Types.ObjectId.isValid(addressId)) return null;
    const doc = await this.doctorProfileModel
      .findOne({ addressId: new Types.ObjectId(addressId), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? DoctorProfileMapper.toDomain(doc) : null;
  }
}
