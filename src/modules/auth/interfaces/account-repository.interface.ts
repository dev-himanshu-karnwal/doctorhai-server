import type { ClientSession } from 'mongoose';
import { AccountEntity } from '../entities';
import type { CreateAccountDto } from '../dto';
import type { UpdateAccountDto } from '../dto';
import type { AddRoleToAccountDto } from '../dto';

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
  findOneByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null>;
  findAllByEmail(
    email: string,
    select?: readonly string[],
  ): Promise<Partial<AccountEntity>[]>;
  create(
    data: CreateAccountDto,
    session?: ClientSession,
  ): Promise<AccountEntity>;
  update(id: string, data: UpdateAccountDto): Promise<AccountEntity>;
  softDelete(id: string): Promise<void>;
  addRole(accountId: string, dto: AddRoleToAccountDto): Promise<AccountEntity>;
  removeRole(accountId: string, roleId: string): Promise<AccountEntity>;
}
