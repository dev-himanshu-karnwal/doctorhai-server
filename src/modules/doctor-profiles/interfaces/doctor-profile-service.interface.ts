import { DoctorProfileEntity } from '../entities';

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
  create(data: CreateDoctorProfileData): Promise<DoctorProfileEntity>;
}
