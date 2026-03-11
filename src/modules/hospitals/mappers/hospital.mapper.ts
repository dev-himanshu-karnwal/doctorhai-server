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
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  type?: string | null;
  timeline?:
    | {
        day: string;
        opentime: string;
        closetime: string;
      }[]
    | null;
  facilities?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  public_view_count?: number;
  isVerified?: boolean;
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
      doc.isVerified ?? false,
      doc.location ?? null,
      doc.type ?? null,
      doc.timeline ?? null,
      doc.facilities ?? null,
      doc.public_view_count ?? 0,
      doc.createdAt,
      doc.updatedAt,
      doc.deletedAt ?? null,
    );
  }
}
