import { PermissionEntity } from '../entities';

export interface PermissionDocLike {
  _id: { toString(): string };
  key: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PermissionMapper {
  static toDomain(doc: PermissionDocLike): PermissionEntity {
    return new PermissionEntity(
      doc._id.toString(),
      doc.key,
      doc.description ?? null,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
