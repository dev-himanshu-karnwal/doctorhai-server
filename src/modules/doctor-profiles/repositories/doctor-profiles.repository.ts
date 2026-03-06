import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { DoctorProfileDocument } from '../schemas';
import { DoctorProfileEntity } from '../entities';
import { DoctorProfileMapper } from '../mappers';
import type {
  IDoctorProfileRepository,
  CreateDoctorProfileInput,
  UpdateDoctorProfileInput,
} from '../interfaces';
import type {
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces/doctor-profile-service.interface';
import {
  buildSort,
  findWithPagination,
} from '../../../common/mongoose/query-helpers';
import type { PaginationOptions } from '../../../common/interfaces';
import console from 'console';

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
      if (Types.ObjectId.isValid(query.hospitalId)) {
        // Match both ObjectId and its string representation to be safe
        // because some records might have it stored as a string.
        baseFilter.hospitalId = query.hospitalId;
      } else {
        baseFilter.hospitalId = String(query.hospitalId);
      }
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
      ['fullName', 'createdAt'] as const,
    );

    const skip = (query.page - 1) * query.limit;

    // When isVerified is not provided, use the fast simple path (no join)
    if (query.isVerified === undefined) {
      const paginationOptions: PaginationOptions = {
        page: query.page,
        limit: query.limit,
      };

      const result = await findWithPagination(
        this.doctorProfileModel,
        baseFilter,
        paginationOptions,
        sort,
      );

      return {
        doctors: result.items.map((doc) => DoctorProfileMapper.toDomain(doc)),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    }

    // Explicitly cast to boolean as query params might arrive as strings despite DTO transforms
    const isVerifiedBool = String(query.isVerified).toLowerCase() === 'true';

    console.log(
      `[DoctorProfilesRepository] isVerified raw value: ${query.isVerified} (type: ${typeof query.isVerified}) -> cast to boolean: ${isVerifiedBool}`,
    );

    // When isVerified is provided (true or false), use aggregation to join accounts.
    // preserveNullAndEmptyArrays: true ensures doctors with no linked account are
    // NOT silently dropped — they will have account: null and be treated as isVerified: false.
    const pipeline: Parameters<typeof this.doctorProfileModel.aggregate>[0] = [
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
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $eq: [{ $ifNull: ['$account.isVerified', false] }, isVerifiedBool],
          },
        },
      },
    ];

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
}
