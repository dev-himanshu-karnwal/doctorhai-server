import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { DoctorProfileDocument } from '../schemas';
import { DoctorProfileEntity } from '../entities';
import { DoctorProfileMapper } from '../mappers';
import type {
  IDoctorProfileRepository,
  CreateDoctorProfileInput,
} from '../interfaces';
import type {
  HospitalDoctorsQuery,
  PaginatedDoctorProfiles,
} from '../interfaces/doctor-profile-service.interface';
import {
  buildSort,
  findWithPagination,
} from '../../../common/mongoose/query-helpers';
import type { PaginationOptions } from '../../../common/interfaces';

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
          designation: data.designation,
          specialization: data.specialization,
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

  async findHospitalDoctors(
    hospitalId: string,
    query: HospitalDoctorsQuery,
  ): Promise<PaginatedDoctorProfiles> {
    if (!Types.ObjectId.isValid(hospitalId)) {
      return {
        doctors: [],
        total: 0,
        page: query.page,
        limit: query.limit,
      };
    }

    const filter: FilterQuery<DoctorProfileDocument> = {
      ...this.notDeleted,
      hospitalId: new Types.ObjectId(hospitalId),
    };

    if (query.specialization != null && query.specialization.trim() !== '') {
      filter.specialization = new RegExp(query.specialization.trim(), 'i');
    }

    if (query.designation != null && query.designation.trim() !== '') {
      filter.designation = new RegExp(query.designation.trim(), 'i');
    }

    if (query.search != null && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { specialization: searchRegex },
        { designation: searchRegex },
        { email: searchRegex },
      ];
    }

    const sort = buildSort<NonNullable<HospitalDoctorsQuery['sortBy']>>(
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
      'fullName',
      ['fullName', 'createdAt'] as const,
    );

    const paginationOptions: PaginationOptions = {
      page: query.page,
      limit: query.limit,
    };

    const result = await findWithPagination(
      this.doctorProfileModel,
      filter,
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
}
