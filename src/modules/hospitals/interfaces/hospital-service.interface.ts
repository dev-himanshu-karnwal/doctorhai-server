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
  updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<HospitalEntity | null>;
  create(
    data: {
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
    },
    session?: ClientSession,
  ): Promise<HospitalEntity>;
  update(
    id: string,
    data: Partial<
      Omit<
        IHospitalService['create'] extends (
          data: infer D,
          ...args: any[]
        ) => any
          ? D
          : any,
        'accountId'
      >
    >,
  ): Promise<HospitalEntity | null>;
  getHospitals(query: HospitalsQuery): Promise<PaginatedHospitals>;
}
