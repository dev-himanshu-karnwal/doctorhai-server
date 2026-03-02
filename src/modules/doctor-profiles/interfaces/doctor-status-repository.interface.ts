import type { ClientSession } from 'mongoose';
import { DoctorStatusEntity } from '../entities';
import { AvailabilityStatus } from '../enums/availability-status.enum';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

export interface CreateDoctorStatusInput {
  doctorProfileId: string;
  status: AvailabilityStatus;
  updatedByAccountId: string;
  updatedByRoleId: string;
  expectedAt?: Date | null;
  expectedAtNote?: string | null;
}

export interface IDoctorStatusRepository {
  findByDoctorProfileId(
    doctorProfileId: string,
  ): Promise<DoctorStatusEntity | null>;
  create(
    data: CreateDoctorStatusInput,
    session?: ClientSession,
  ): Promise<DoctorStatusEntity>;
  updateStatus(data: UpdateDoctorStatusDto): Promise<DoctorStatusEntity>;
}
