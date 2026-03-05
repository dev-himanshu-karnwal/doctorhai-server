import { AccountDocument } from '../../auth/schemas';
import {
  AccountEntity,
  AccountRoleAssignmentEntity,
} from '../../auth/entities';

export class AccountMapper {
  static toDomain(doc: AccountDocument): AccountEntity {
    const roles = (doc.roles || []).map(
      (r) =>
        new AccountRoleAssignmentEntity(
          r.roleId.toString(),
          r.grantedBy ? r.grantedBy.toString() : null,
          r.grantedAt,
        ),
    );

    return new AccountEntity(
      doc._id.toString(),
      doc.loginType,
      doc.email,
      doc.username,
      doc.passwordHash,
      doc.isActive,
      doc.isVerified,
      doc.passwordUpdatedAt,
      roles,
      doc.createdAt,
      doc.updatedAt,
      doc.deletedAt,
    );
  }
}
