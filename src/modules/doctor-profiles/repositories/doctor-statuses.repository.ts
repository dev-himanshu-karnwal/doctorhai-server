import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { DoctorStatusDocument } from '../schemas';
import { DoctorStatusEntity } from '../entities';
import { DoctorStatusMapper } from '../mappers/doctor-status.mapper';
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
  ): Promise<DoctorStatusEntity | null> {
    if (!Types.ObjectId.isValid(doctorProfileId)) return null;
    const doc = await this.doctorStatusModel
      .findOne({ doctorProfileId: new Types.ObjectId(doctorProfileId) })
      .lean()
      .exec();
    return doc ? DoctorStatusMapper.toDomain(doc as any) : null;
  }

  async create(
    data: CreateDoctorStatusInput,
    session?: ClientSession,
  ): Promise<DoctorStatusEntity> {
    const options = session ? { session } : {};
    const [doc] = await this.doctorStatusModel.create(
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
    );
    return DoctorStatusMapper.toDomain(doc as any);
  }

  async updateStatus(data: UpdateDoctorStatusDto): Promise<DoctorStatusEntity> {
    const doc = await this.doctorStatusModel
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
      .exec();

    if (!doc) {
      throw new Error(
        `Doctor status not found for profile: ${data.doctorProfileId}`,
      );
    }

    return DoctorStatusMapper.toDomain(doc as any);
  }
}
