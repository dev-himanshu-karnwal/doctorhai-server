import { AccountEntity, AccountRoleAssignmentEntity } from '../entities';
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from './account-repository.interface';

export interface IAccountService {
  findById(id: string): Promise<AccountEntity>;
  findByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<AccountEntity | null>;
  create(data: CreateAccountInput): Promise<AccountEntity>;
  update(id: string, data: UpdateAccountInput): Promise<AccountEntity>;
  softDelete(id: string): Promise<void>;
  addRole(
    accountId: string,
    assignment: AccountRoleAssignmentEntity,
  ): Promise<AccountEntity>;
  removeRole(accountId: string, roleId: string): Promise<AccountEntity>;
}
