import type { ClientSession } from 'mongoose';
import { HospitalEntity } from '../entities';
import type {
  HospitalsQuery,
  PaginatedHospitals,
} from './hospital-service.interface';

export interface CreateHospitalInput {
  accountId: string;
  addressId?: string | null;
  name: string;
  slug: string;
  phone: string;
  email: string;
  coverPhotoUrl?: string | null;
}

export interface IHospitalRepository {
  findByAccountId(accountId: string): Promise<HospitalEntity | null>;
  create(
    data: CreateHospitalInput,
    session?: ClientSession,
  ): Promise<HospitalEntity>;
  findHospitals(query: HospitalsQuery): Promise<PaginatedHospitals>;
  updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<HospitalEntity | null>;
}
