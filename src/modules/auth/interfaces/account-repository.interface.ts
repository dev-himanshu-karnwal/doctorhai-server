import { AccountEntity, AccountRoleAssignmentEntity } from '../entities';

export interface CreateAccountInput {
  loginType: string;
  loginValue: string;
  passwordHash?: string | null;
  isActive?: boolean;
  roles?: { roleId: string; grantedBy?: string | null }[];
}

export interface UpdateAccountInput {
  passwordHash?: string | null;
  isActive?: boolean;
  passwordUpdatedAt?: Date | null;
  roles?: { roleId: string; grantedBy?: string | null }[];
}

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
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
