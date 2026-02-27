import { AccountEntity } from '../entities';
import type { ClientSession } from 'mongoose';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AddRoleToAccountDto,
} from '../dto';

export interface IAccountService {
  findById(id: string): Promise<AccountEntity>;
  findAllByEmail(
    email: string,
    select?: readonly string[],
  ): Promise<Partial<AccountEntity>[]>;
  findOneByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null>;
  create(
    data: CreateAccountDto,
    session?: ClientSession,
  ): Promise<AccountEntity>;
  update(id: string, data: UpdateAccountDto): Promise<AccountEntity>;
  softDelete(id: string): Promise<void>;
  addRole(accountId: string, dto: AddRoleToAccountDto): Promise<AccountEntity>;
  removeRole(accountId: string, roleId: string): Promise<AccountEntity>;
}
