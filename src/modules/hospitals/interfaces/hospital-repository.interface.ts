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
  location?: { latitude: number; longitude: number } | null;
  type?: string | null;
  timeline?: { day: string; opentime: string; closetime: string }[] | null;
  facilities?: string[] | null;
  isActive?: boolean;
}

export interface IHospitalRepository {
  findById(id: string): Promise<HospitalEntity | null>;
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
  update(
    id: string,
    data: Partial<Omit<CreateHospitalInput, 'accountId'>>,
    session?: ClientSession,
  ): Promise<HospitalEntity | null>;
  incrementViewCount(id: string): Promise<void>;
}
