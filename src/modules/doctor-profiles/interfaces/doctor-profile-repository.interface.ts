import type { ClientSession } from 'mongoose';
import { DoctorProfileEntity } from '../entities';
import type {
  DoctorsQuery,
  PaginatedDoctorProfiles,
} from './doctor-profile-service.interface';
import { DoctorStats } from '../dto/doctor-stats.dto';
export { DoctorStats };

export interface CreateDoctorProfileInput {
  fullName: string;
  designation?: string | null;
  specialization?: string | null;
  phone: string;
  email: string;
  addressId?: string | null;
  accountId: string;
  slug: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  createdBy?: string | null;
  hospitalId?: string | null;
}

export interface UpdateDoctorProfileInput {
  fullName?: string;
  designation?: string | null;
  specialization?: string | null;
  bio?: string | null;
  slug?: string;
  hasExperience?: string | null;
}

export interface IDoctorProfileRepository {
  findById(id: string): Promise<DoctorProfileEntity | null>;
  findByAccountId(accountId: string): Promise<DoctorProfileEntity | null>;
  findByEmailAndHospitalId(
    email: string,
    hospitalId: string | null,
  ): Promise<DoctorProfileEntity | null>;
  create(
    data: CreateDoctorProfileInput,
    session?: ClientSession,
  ): Promise<DoctorProfileEntity>;
  findDoctors(query: DoctorsQuery): Promise<PaginatedDoctorProfiles>;
  update(
    id: string,
    data: UpdateDoctorProfileInput,
  ): Promise<DoctorProfileEntity | null>;
  updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<DoctorProfileEntity | null>;
  findSpecializationsByHospitalIds(
    hospitalIds: string[],
  ): Promise<{ hospitalId: string; specialization: string }[]>;
  incrementViewCount(id: string): Promise<void>;
  getStats(hospitalId?: string): Promise<DoctorStats>;
}
