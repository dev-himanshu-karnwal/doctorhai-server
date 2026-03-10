import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, ClientSession } from 'mongoose';
import { AccountDocument } from '../../auth/schemas';
import { AccountEntity } from '../../auth/entities';
import { AccountMapper } from '../mappers/account.mapper';
import { IAccountRepository } from '../interfaces/account-repository.interface';
import { AccountsQueryDto } from '../dto/accounts-query.dto';
import { PaginatedResult } from '../../../common/interfaces';
import {
  buildSort,
  findWithPagination,
} from '../../../common/mongoose/query-helpers';

@Injectable()
export class AccountRepository implements IAccountRepository {
  constructor(
    @InjectModel('Account')
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private readonly notDeleted = { deletedAt: null };

  async findById(id: string): Promise<AccountEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.accountModel.findById(id).exec();
    return doc ? AccountMapper.toDomain(doc) : null;
  }

  async findAccounts(
    query: AccountsQueryDto,
  ): Promise<PaginatedResult<AccountEntity>> {
    const filter: FilterQuery<AccountDocument> = {
      ...this.notDeleted,
    };

    if (query.search != null && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ email: searchRegex }, { username: searchRegex }];
    }

    const sort = buildSort(
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
      'createdAt',
      ['email', 'username', 'createdAt'],
    );

    const result = await findWithPagination(
      this.accountModel,
      filter,
      { page: query.page, limit: query.limit },
      sort,
    );

    return {
      items: result.items.map((doc) => AccountMapper.toDomain(doc)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
  ): Promise<AccountEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.accountModel
      .findByIdAndUpdate(
        id,
        { $set: { isVerified } },
        { new: true, runValidators: true },
      )
      .exec();
    return doc ? AccountMapper.toDomain(doc) : null;
  }

  async delete(id: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    const options = session ? { session } : {};
    await this.accountModel.findByIdAndDelete(id, options).exec();
  }
}
