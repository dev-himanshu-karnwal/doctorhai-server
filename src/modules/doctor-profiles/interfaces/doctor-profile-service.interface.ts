import type { ClientSession } from 'mongoose';
import { DoctorProfileEntity } from '../entities';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';

export interface CreateDoctorProfileData {
  fullName: string;
  designation: string;
  specialization: string;
  phone: string;
  email: string;
  addressId: string;
  accountId: string;
  slug: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  createdBy?: string | null;
  hospitalId?: string | null;
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
}
