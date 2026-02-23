import { AccountEntity } from '../entities';
import type { CreateAccountDto } from '../dto';
import type { UpdateAccountDto } from '../dto';
import type { AddRoleToAccountDto } from '../dto';

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
  findByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null>;
  create(data: CreateAccountDto): Promise<AccountEntity>;
  update(id: string, data: UpdateAccountDto): Promise<AccountEntity>;
  softDelete(id: string): Promise<void>;
  addRole(accountId: string, dto: AddRoleToAccountDto): Promise<AccountEntity>;
  removeRole(accountId: string, roleId: string): Promise<AccountEntity>;
}
