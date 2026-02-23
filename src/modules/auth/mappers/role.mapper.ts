import { RoleEntity } from '../entities';

export interface RoleDocLike {
  _id: { toString(): string };
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissionIds?: { toString(): string }[];
  createdAt: Date;
  updatedAt: Date;
}

export class RoleMapper {
  static toDomain(doc: RoleDocLike): RoleEntity {
    const permissionIds = (doc.permissionIds ?? []).map((id) => id.toString());
    return new RoleEntity(
      doc._id.toString(),
      doc.name,
      doc.description ?? null,
      doc.isSystem ?? false,
      permissionIds,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
