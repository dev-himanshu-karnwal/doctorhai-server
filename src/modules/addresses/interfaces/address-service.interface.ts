import type { ClientSession } from 'mongoose';
import { AddressEntity } from '../entities';

export interface IAddressService {
  findById(id: string): Promise<AddressEntity>;
  create(
    data: {
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      pincode: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    session?: ClientSession,
  ): Promise<AddressEntity>;
  update(
    id: string,
    data: {
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    session?: ClientSession,
  ): Promise<AddressEntity | null>;
  findByIdWithPermission(
    id: string,
    requesterAccountId: string,
  ): Promise<AddressEntity>;
  updateWithPermission(
    id: string,
    data: {
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    requesterAccountId: string,
  ): Promise<AddressEntity>;
  upsertByAccount(
    targetAccountId: string,
    requesterAccountId: string,
    data: {
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number | null;
      longitude?: number | null;
      addressId?: string;
    },
  ): Promise<AddressEntity>;
}
