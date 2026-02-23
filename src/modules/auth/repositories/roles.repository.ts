import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { Model, Types } from 'mongoose';
import { RoleDocument } from '../schemas';
import { RoleEntity } from '../entities';
import { RoleMapper } from '../mappers';
import type { IRoleRepository } from '../interfaces';
import type { CreateRoleDto, UpdateRoleDto } from '../dto';

@Injectable()
export class RolesRepository implements IRoleRepository {
  constructor(
    @InjectModel('Role')
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findById(id: string): Promise<RoleEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.roleModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    return doc ? RoleMapper.toDomain(doc) : null;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const doc = await this.roleModel.findOne({ name }).lean().exec();
    return doc ? RoleMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<RoleEntity[]> {
    const docs = await this.roleModel
      .find()
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return docs.map((d) => RoleMapper.toDomain(d));
  }

  async create(data: CreateRoleDto): Promise<RoleEntity> {
    const permissionIds: string[] = data.permissions ?? [];
    const permissions: Types.ObjectId[] = permissionIds.map(
      (id: string) => new Types.ObjectId(id),
    );
    const [doc] = await this.roleModel.create([
      {
        name: data.name,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
        permissions,
      },
    ]);
    return RoleMapper.toDomain(doc);
  }

  async update(id: string, data: UpdateRoleDto): Promise<RoleEntity> {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.isSystem !== undefined) update.isSystem = data.isSystem;
    if (data.permissions !== undefined) {
      update.permissions = data.permissions.map(
        (pid: string) => new Types.ObjectId(pid),
      );
    }
    const doc = await this.roleModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: update },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Role', id);
    return RoleMapper.toDomain(doc);
  }
}
