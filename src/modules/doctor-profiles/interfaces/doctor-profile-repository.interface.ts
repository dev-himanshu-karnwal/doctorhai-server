import { DoctorProfileEntity } from '../entities';

export interface CreateDoctorProfileInput {
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

export interface IDoctorProfileRepository {
  findByAccountId(accountId: string): Promise<DoctorProfileEntity | null>;
  create(data: CreateDoctorProfileInput): Promise<DoctorProfileEntity>;
}
