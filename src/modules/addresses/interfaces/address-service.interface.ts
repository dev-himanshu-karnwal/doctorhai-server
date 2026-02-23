import { AddressEntity } from '../entities';

export interface IAddressService {
  findById(id: string): Promise<AddressEntity>;
  create(data: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<AddressEntity>;
}
