import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { DoctorStatusDocument } from '../schemas/doctor-status.schema';
import { DoctorStatusEntity } from '../entities/doctor-status.entity';
import {
  DoctorStatusMapper,
  DoctorStatusDocLike,
} from '../mappers/doctor-status.mapper';
import type {
  IDoctorStatusRepository,
  CreateDoctorStatusInput,
} from '../interfaces/doctor-status-repository.interface';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

@Injectable()
export class DoctorStatusesRepository implements IDoctorStatusRepository {
  constructor(
    @InjectModel('DoctorStatus')
    private readonly doctorStatusModel: Model<DoctorStatusDocument>,
  ) {}

  async findByDoctorProfileId(
    doctorProfileId: string,
  ): ReturnType<IDoctorStatusRepository['findByDoctorProfileId']> {
    if (!Types.ObjectId.isValid(doctorProfileId)) return null;
    const doc = (await this.doctorStatusModel
      .findOne({ doctorProfileId: new Types.ObjectId(doctorProfileId) })
      .lean()
      .exec()) as DoctorStatusDocLike | null;
    return doc ? DoctorStatusMapper.toDomain(doc) : null;
  }

  async findByDoctorProfileIds(
    doctorProfileIds: string[],
  ): Promise<DoctorStatusEntity[]> {
    const validIds = doctorProfileIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (validIds.length === 0) return [];

    const docs = (await this.doctorStatusModel
      .find({ doctorProfileId: { $in: validIds } })
      .lean()
      .exec()) as DoctorStatusDocLike[];

    return docs.map((doc) => DoctorStatusMapper.toDomain(doc));
  }

  async create(
    data: CreateDoctorStatusInput,
    session?: ClientSession,
  ): ReturnType<IDoctorStatusRepository['create']> {
    const options = session ? { session } : {};
    const created = (await this.doctorStatusModel.create(
      [
        {
          doctorProfileId: new Types.ObjectId(data.doctorProfileId),
          status: data.status,
          updatedByAccountId: new Types.ObjectId(data.updatedByAccountId),
          updatedByRoleId: new Types.ObjectId(data.updatedByRoleId),
          expectedAt: data.expectedAt ?? null,
          expectedAtNote: data.expectedAtNote ?? null,
        },
      ],
      options,
    )) as unknown as [DoctorStatusDocLike];
    const doc = created[0];
    return DoctorStatusMapper.toDomain(doc);
  }

  async updateStatus(data: UpdateDoctorStatusDto): Promise<DoctorStatusEntity> {
    const doc = (await this.doctorStatusModel
      .findOneAndUpdate(
        { doctorProfileId: data.doctorProfileId },
        {
          $set: {
            status: data.status,
            updatedByAccountId: data.updatedByAccountId,
            updatedByRoleId: data.updatedByRoleId,
            expectedAt: data.expectedAt,
            expectedAtNote: data.expectedAtNote,
          },
        },
        { new: true },
      )
      .lean()
      .exec()) as DoctorStatusDocLike | null;

    if (!doc) {
      throw new Error(
        `Doctor status not found for profile: ${data.doctorProfileId}`,
      );
    }

    return DoctorStatusMapper.toDomain(doc);
  }

  async deleteByDoctorProfileId(
    doctorProfileId: string,
    session?: ClientSession,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(doctorProfileId)) return;
    const options = session ? { session } : {};
    await this.doctorStatusModel
      .deleteOne(
        { doctorProfileId: new Types.ObjectId(doctorProfileId) },
        options,
      )
      .exec();
  }
}
