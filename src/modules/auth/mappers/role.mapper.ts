import { RoleEntity } from '../entities';

export interface RoleDocLike {
  _id: { toString(): string };
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissions?: { toString(): string }[];
  createdAt: Date;
  updatedAt: Date;
}

export class RoleMapper {
  static toDomain(doc: RoleDocLike): RoleEntity {
    const permissions = (doc.permissions ?? []).map((id) => id.toString());
    return new RoleEntity(
      doc._id.toString(),
      doc.name,
      doc.description ?? null,
      doc.isSystem ?? false,
      permissions,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
