import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { ClientSession, Model, Types } from 'mongoose';
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

  async findOneByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null> {
    const filter: Record<string, unknown> = { loginType, ...this.notDeleted };
    if (loginType === 'email') {
      filter.email = loginValue.toLowerCase().trim();
    } else {
      filter.username = loginValue.trim();
    }

    const doc = await this.accountModel
      .findOne(filter)
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return doc ? AccountMapper.toDomain(doc) : null;
  }

  async findAllByEmail(
    email: string,
    select?: readonly string[],
  ): Promise<AccountEntity[]> {
    const docs = await this.accountModel
      .find({ email: email.toLowerCase().trim(), ...this.notDeleted })
      .sort({ createdAt: 1 })
      .select(select ?? [])
      .lean()
      .exec();
    return docs.map((doc) => AccountMapper.toDomain(doc));
  }

  async create(
    data: CreateAccountDto,
    session?: ClientSession,
  ): Promise<AccountEntity> {
    const roles = (data.roles ?? []).map((r) => ({
      roleId: new Types.ObjectId(r.roleId),
      grantedBy: r.grantedBy != null ? new Types.ObjectId(r.grantedBy) : null,
      grantedAt: new Date(),
    }));
    const options = session ? { session } : {};
    const [doc] = await this.accountModel.create(
      [
        {
          loginType: data.loginType,
          email: data.email.toLowerCase().trim(),
          username: data.username ?? null,
          passwordHash: data.passwordHash ?? null,
          isActive: data.isActive ?? true,
          roles,
          deletedAt: null,
        },
      ],
      options,
    );
    return AccountMapper.toDomain(doc);
  }

  async update(id: string, data: UpdateAccountDto): Promise<AccountEntity> {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.email !== undefined)
      update.email = data.email.toLowerCase().trim();
    if (data.passwordHash !== undefined)
      update.passwordHash = data.passwordHash;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.isVerified !== undefined) update.isVerified = data.isVerified;
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
