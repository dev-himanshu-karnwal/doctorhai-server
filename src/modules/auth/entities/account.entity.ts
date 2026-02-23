import { AccountRoleAssignmentEntity } from './account-role-assignment.entity';

export class AccountEntity {
  constructor(
    public readonly id: string,
    public readonly loginType: string,
    public readonly loginValue: string,
    public readonly isActive: boolean,
    public readonly passwordUpdatedAt: Date | null,
    public readonly roles: AccountRoleAssignmentEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
