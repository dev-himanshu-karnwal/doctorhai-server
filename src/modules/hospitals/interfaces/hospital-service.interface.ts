import type { ClientSession } from 'mongoose';
import { HospitalEntity } from '../entities';
import { HospitalStats } from '../dto/hospital_stats.dto';

export interface HospitalsQuery {
  page: number;
  limit: number;
  search?: string;
  name?: string;
  isActive?: string;
  isVerified?: string;
  isAvailable?: string;
  specialities?: string[];
  sortBy?: 'name' | 'createdAt' | 'public_view_count';
  sortOrder?: 'asc' | 'desc';
  city?: string;
  state?: string;
  experience?: string[];
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
        ) => Promise<any>
          ? D
          : any,
        'accountId'
      >
    >,
  ): Promise<HospitalEntity | null>;
  getHospitals(query: HospitalsQuery): Promise<PaginatedHospitals>;
  findById(id: string): Promise<HospitalEntity | null>;
  incrementHospitalViewCount(hospitalId: string): Promise<void>;
  getStats(): Promise<HospitalStats>;
  findByAddressId(addressId: string): Promise<HospitalEntity | null>;
  updateAddressId(id: string, addressId: string): Promise<void>;
}
