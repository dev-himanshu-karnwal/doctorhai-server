import { AddressEntity } from '../entities';

export interface AddressDocLike {
  _id: { toString(): string };
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  accountId?: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressMapper {
  static toDomain(doc: AddressDocLike): AddressEntity {
    return new AddressEntity(
      doc._id.toString(),
      doc.accountId ? doc.accountId.toString() : null,
      doc.addressLine1,
      doc.addressLine2 ?? null,
      doc.city,
      doc.state,
      doc.pincode,
      doc.latitude ?? null,
      doc.longitude ?? null,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
