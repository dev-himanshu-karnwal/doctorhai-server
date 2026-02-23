import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { Model, Types } from 'mongoose';
import { AccountDocument } from '../schemas';
import { AccountEntity } from '../entities';
import { AccountMapper } from '../mappers';
import type { IAccountRepository } from '../interfaces';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AddRoleToAccountDto,
} from '../dto';

@Injectable()
export class AccountsRepository implements IAccountRepository {
  constructor(
    @InjectModel('Account')
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

  async findById(id: string): Promise<AccountEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.accountModel
      .findOne({ _id: new Types.ObjectId(id), ...this.notDeleted })
      .lean()
      .exec();
    return doc ? AccountMapper.toDomain(doc) : null;
  }

  async findByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null> {
    const doc = await this.accountModel
      .findOne({ loginType, loginValue, ...this.notDeleted })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return doc ? AccountMapper.toDomain(doc) : null;
  }

  async create(data: CreateAccountDto): Promise<AccountEntity> {
    const roles = (data.roles ?? []).map((r) => ({
      roleId: new Types.ObjectId(r.roleId),
      grantedBy: r.grantedBy != null ? new Types.ObjectId(r.grantedBy) : null,
      grantedAt: new Date(),
    }));
    const [doc] = await this.accountModel.create([
      {
        loginType: data.loginType,
        loginValue: data.loginValue,
        passwordHash: data.passwordHash ?? null,
        isActive: data.isActive ?? true,
        roles,
        deletedAt: null,
      },
    ]);
    return AccountMapper.toDomain(doc);
  }

  async update(id: string, data: UpdateAccountDto): Promise<AccountEntity> {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.passwordHash !== undefined)
      update.passwordHash = data.passwordHash;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.passwordUpdatedAt !== undefined) {
      update.passwordUpdatedAt =
        typeof data.passwordUpdatedAt === 'string'
          ? new Date(data.passwordUpdatedAt)
          : data.passwordUpdatedAt;
    }
    if (data.roles !== undefined) {
      update.roles = data.roles.map((r) => ({
        roleId: new Types.ObjectId(r.roleId),
        grantedBy: r.grantedBy != null ? new Types.ObjectId(r.grantedBy) : null,
        grantedAt: new Date(),
      }));
    }
    const doc = await this.accountModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...this.notDeleted },
        { $set: update },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Account', id);
    return AccountMapper.toDomain(doc);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.accountModel
      .updateOne(
        { _id: new Types.ObjectId(id), ...this.notDeleted },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } },
      )
      .exec();
    if (result.matchedCount === 0)
      throw new ResourceNotFoundException('Account', id);
  }

  async addRole(
    accountId: string,
    dto: AddRoleToAccountDto,
  ): Promise<AccountEntity> {
    const doc = await this.accountModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(accountId), ...this.notDeleted },
        {
          $push: {
            roles: {
              roleId: new Types.ObjectId(dto.roleId),
              grantedBy:
                dto.grantedBy != null
                  ? new Types.ObjectId(dto.grantedBy)
                  : null,
              grantedAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Account', accountId);
    return AccountMapper.toDomain(doc);
  }

  async removeRole(accountId: string, roleId: string): Promise<AccountEntity> {
    const doc = await this.accountModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(accountId), ...this.notDeleted },
        {
          $pull: { roles: { roleId: new Types.ObjectId(roleId) } },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new ResourceNotFoundException('Account', accountId);
    return AccountMapper.toDomain(doc);
  }
}
