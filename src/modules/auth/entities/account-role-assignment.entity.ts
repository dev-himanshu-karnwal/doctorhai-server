export class AccountRoleAssignmentEntity {
  constructor(
    public readonly roleId: string,
    public readonly grantedBy: string | null,
    public readonly grantedAt: Date,
  ) {}
}
