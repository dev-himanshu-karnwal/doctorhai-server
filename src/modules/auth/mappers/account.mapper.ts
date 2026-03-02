import { AccountEntity, AccountRoleAssignmentEntity } from '../entities';

export interface AccountRoleAssignmentDocLike {
  roleId: { toString(): string };
  grantedBy?: { toString(): string } | null;
  grantedAt: Date;
}

export interface AccountDocLike {
  _id: { toString(): string };
  loginType: string;
  email: string;
  username?: string | null;
  passwordHash?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  passwordUpdatedAt?: Date | null;
  roles?: AccountRoleAssignmentDocLike[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

function toRoleAssignment(
  doc: AccountRoleAssignmentDocLike,
): AccountRoleAssignmentEntity {
  return new AccountRoleAssignmentEntity(
    doc.roleId.toString(),
    doc.grantedBy != null ? doc.grantedBy.toString() : null,
    doc.grantedAt,
  );
}

export class AccountMapper {
  static toDomain(doc: AccountDocLike): AccountEntity {
    const roles = (doc.roles ?? []).map(toRoleAssignment);
    return new AccountEntity(
      doc._id.toString(),
      doc.loginType,
      doc.email,
      doc.username ?? null,
      doc.passwordHash ?? null,
      doc.isActive ?? true,
      doc.isVerified ?? false,
      doc.passwordUpdatedAt ?? null,
      roles,
      doc.createdAt,
      doc.updatedAt,
      doc.deletedAt ?? null,
    );
  }
}
