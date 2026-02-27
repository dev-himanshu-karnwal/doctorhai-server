import { AccountRoleAssignmentEntity } from '.';

export class AccountEntity {
  constructor(
    public readonly id: string,
    public readonly loginType: string,
    public readonly email: string,
    public readonly username: string | null,
    /** Only present when loaded for auth (e.g. login); never expose in API responses */
    public readonly passwordHash: string | null,
    public readonly isActive: boolean,
    public readonly passwordUpdatedAt: Date | null,
    public readonly roles: AccountRoleAssignmentEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
