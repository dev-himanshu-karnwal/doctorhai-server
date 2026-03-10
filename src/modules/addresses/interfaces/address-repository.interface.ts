import type { ClientSession } from 'mongoose';
import { AddressEntity } from '../entities';

export interface CreateAddressInput {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IAddressRepository {
  findById(id: string): Promise<AddressEntity | null>;
  create(
    data: CreateAddressInput,
    session?: ClientSession,
  ): Promise<AddressEntity>;
  delete(id: string, session?: ClientSession): Promise<void>;
}
