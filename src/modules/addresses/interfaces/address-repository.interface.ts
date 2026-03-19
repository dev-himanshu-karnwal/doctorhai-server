import type { ClientSession } from 'mongoose';
import { AddressEntity } from '../entities';

export interface CreateAddressInput {
  accountId: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateAddressInput {
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  addressId?: string;
  accountId?: string;
}

export interface IAddressRepository {
  findById(id: string): Promise<AddressEntity | null>;
  findByAccountId(accountId: string): Promise<AddressEntity | null>;
  create(
    data: CreateAddressInput,
    session?: ClientSession,
  ): Promise<AddressEntity>;
  update(
    id: string,
    data: UpdateAddressInput,
    session?: ClientSession,
  ): Promise<AddressEntity | null>;
  delete(id: string, session?: ClientSession): Promise<void>;
}
