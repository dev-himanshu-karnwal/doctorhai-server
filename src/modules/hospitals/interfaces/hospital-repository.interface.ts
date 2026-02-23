import { HospitalEntity } from '../entities';

export interface CreateHospitalInput {
  accountId: string;
  addressId: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  coverPhotoUrl?: string | null;
}

export interface IHospitalRepository {
  findByAccountId(accountId: string): Promise<HospitalEntity | null>;
  create(data: CreateHospitalInput): Promise<HospitalEntity>;
}
