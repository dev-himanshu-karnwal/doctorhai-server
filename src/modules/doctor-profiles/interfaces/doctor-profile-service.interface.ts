import type { ClientSession } from 'mongoose';
import { DoctorProfileEntity } from '../entities';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import type { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import type {
  DoctorProfileResponseDto,
  PaginatedDoctorsResponseDto,
} from '../dto/doctor-profile-response.dto';

export interface CreateDoctorProfileData {
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

export interface HospitalDoctorsQuery {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  designation?: string;
  sortBy?: 'fullName' | 'createdAt' | 'public_view_count';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorsQuery extends HospitalDoctorsQuery {
  hospitalId?: string;
  isVerified?: boolean;
}

export interface PaginatedDoctorProfiles {
  doctors: DoctorProfileEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface IDoctorProfileService {
  findByAccountId(accountId: string): Promise<DoctorProfileEntity | null>;
  findByEmailAndHospitalId(
    email: string,
    hospitalId: string | null,
  ): Promise<DoctorProfileEntity | null>;
  create(
    data: CreateDoctorProfileData,
    session?: ClientSession,
  ): Promise<DoctorProfileEntity>;
  createByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<DoctorProfileEntity>;
  getDoctors(query: DoctorsQuery): Promise<PaginatedDoctorsResponseDto>;
  getDoctorById(id: string): Promise<DoctorProfileResponseDto>;
  updateProfile(
    doctorProfileId: string,
    dto: UpdateDoctorProfileDto,
    updatedByAccountId: string,
  ): Promise<DoctorProfileEntity>;
  updateEmailByAccountId(
    accountId: string,
    email: string,
  ): Promise<DoctorProfileEntity | null>;
  getSpecializationsByHospitalIds(
    hospitalIds: string[],
  ): Promise<Map<string, string[]>>;
}
