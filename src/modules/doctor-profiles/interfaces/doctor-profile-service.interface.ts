import type { ClientSession } from 'mongoose';
import { DoctorProfileEntity } from '../entities';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';
import { CreateDoctorStatusInput } from './doctor-status-repository.interface';

export interface CreateDoctorProfileData {
  fullName: string;
  designation: string;
  specialization: string;
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
  sortBy?: 'fullName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
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
  getDoctorsForHospital(
    hospitalId: string,
    query: HospitalDoctorsQuery,
  ): Promise<PaginatedDoctorProfiles>;
  createInitialStatus(
    data: CreateDoctorStatusInput,
    session?: ClientSession,
  ): Promise<void>;
  updateStatus(data: UpdateDoctorStatusDto): Promise<void>;
}
