import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { Model, Types } from 'mongoose';
import { PermissionDocument } from '../schemas';
import { PermissionEntity } from '../entities';
import { PermissionMapper } from '../mappers';
import type { IPermissionRepository } from '../interfaces';
import type { CreatePermissionDto, UpdatePermissionDto } from '../dto';

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

  async create(data: CreatePermissionDto): Promise<PermissionEntity> {
    const [doc] = await this.permissionModel.create([
      { key: data.key, description: data.description ?? null },
    ]);
    return PermissionMapper.toDomain(doc);
  }

  async update(
    id: string,
    data: UpdatePermissionDto,
  ): Promise<PermissionEntity> {
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
      ...(data.key !== undefined && { key: data.key }),
      ...(data.description !== undefined && { description: data.description }),
    };
    const doc = await this.permissionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: update },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Permission', id);
    return PermissionMapper.toDomain(doc);
  }
}
