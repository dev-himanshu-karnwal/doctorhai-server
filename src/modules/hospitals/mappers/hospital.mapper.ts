import { HospitalEntity } from '../entities';

export interface HospitalDocLike {
  _id: { toString(): string };
  accountId: { toString(): string };
  addressId?: { toString(): string } | null;
  name: string;
  slug: string;
  phone: string;
  email: string;
  coverPhotoUrl?: string | null;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class HospitalMapper {
  static toDomain(doc: HospitalDocLike): HospitalEntity {
    return new HospitalEntity(
      doc._id.toString(),
      doc.accountId.toString(),
      doc.addressId != null ? doc.addressId.toString() : null,
      doc.name,
      doc.slug,
      doc.phone,
      doc.email,
      doc.coverPhotoUrl ?? null,
      doc.isActive ?? true,
      doc.createdAt,
      doc.updatedAt,
      doc.deletedAt ?? null,
    );
  }
}
