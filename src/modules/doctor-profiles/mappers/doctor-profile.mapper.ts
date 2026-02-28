import { DoctorProfileEntity } from '../entities';

export interface DoctorProfileDocLike {
  _id: { toString(): string };
  fullName: string;
  designation?: string | null;
  specialization?: string | null;
  phone: string;
  email: string;
  addressId?: { toString(): string } | null;
  accountId: { toString(): string };
  slug: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  createdBy?: { toString(): string } | null;
  hospitalId?: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class DoctorProfileMapper {
  static toDomain(doc: DoctorProfileDocLike): DoctorProfileEntity {
    return new DoctorProfileEntity(
      doc._id.toString(),
      doc.fullName,
      doc.designation ?? null,
      doc.specialization ?? null,
      doc.phone,
      doc.email,
      doc.addressId != null ? doc.addressId.toString() : null,
      doc.accountId.toString(),
      doc.slug,
      doc.bio ?? null,
      doc.profilePhotoUrl ?? null,
      doc.createdBy != null ? doc.createdBy.toString() : null,
      doc.hospitalId != null ? doc.hospitalId.toString() : null,
      doc.createdAt,
      doc.updatedAt,
      doc.deletedAt ?? null,
    );
  }
}
