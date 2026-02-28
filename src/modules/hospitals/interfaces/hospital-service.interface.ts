import type { ClientSession } from 'mongoose';
import { HospitalEntity } from '../entities';

export interface HospitalsQuery {
  page: number;
  limit: number;
  search?: string;
  name?: string;
  isActive?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedHospitals {
  hospitals: HospitalEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface IHospitalService {
  findByAccountId(accountId: string): Promise<HospitalEntity | null>;
  create(
    data: {
      accountId: string;
      addressId?: string | null;
      name: string;
      slug: string;
      phone: string;
      email: string;
      coverPhotoUrl?: string | null;
    },
    session?: ClientSession,
  ): Promise<HospitalEntity>;
  getHospitals(query: HospitalsQuery): Promise<PaginatedHospitals>;
}
