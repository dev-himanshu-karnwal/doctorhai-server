import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { Model, Types } from 'mongoose';
import { PermissionDocument } from '../schemas';
import { PermissionEntity } from '../entities';
import { PermissionMapper } from '../mappers';
import type {
  CreatePermissionInput,
  IPermissionRepository,
  UpdatePermissionInput,
} from '../interfaces';

@Injectable()
export class PermissionsRepository implements IPermissionRepository {
  constructor(
    @InjectModel('Permission')
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findById(id: string): Promise<PermissionEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.permissionModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    return doc ? PermissionMapper.toDomain(doc) : null;
  }

  async findByKey(key: string): Promise<PermissionEntity | null> {
    const doc = await this.permissionModel.findOne({ key }).lean().exec();
    return doc ? PermissionMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<PermissionEntity[]> {
    const docs = await this.permissionModel
      .find()
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return docs.map((d) => PermissionMapper.toDomain(d));
  }

  async create(data: CreatePermissionInput): Promise<PermissionEntity> {
    const [doc] = await this.permissionModel.create([
      { key: data.key, description: data.description ?? null },
    ]);
    return PermissionMapper.toDomain(doc);
  }

  async update(
    id: string,
    data: UpdatePermissionInput,
  ): Promise<PermissionEntity> {
    const doc = await this.permissionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Permission', id);
    return PermissionMapper.toDomain(doc);
  }
}
