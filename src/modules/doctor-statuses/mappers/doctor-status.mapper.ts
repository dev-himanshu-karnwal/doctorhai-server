import { DoctorStatusEntity } from '../entities/doctor-status.entity';
import { AvailabilityStatus } from '../enums/availability-status.enum';

export interface DoctorStatusDocLike {
  _id: { toString(): string };
  doctorProfileId: { toString(): string };
  status: string;
  expectedAt?: Date | null;
  expectedAtNote?: string | null;
  updatedByAccountId: { toString(): string };
  updatedByRoleId: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}

export class DoctorStatusMapper {
  static toDomain(doc: DoctorStatusDocLike): DoctorStatusEntity {
    return new DoctorStatusEntity(
      doc._id.toString(),
      doc.doctorProfileId.toString(),
      doc.status as AvailabilityStatus,
      doc.expectedAt ?? null,
      doc.expectedAtNote ?? null,
      doc.updatedByAccountId.toString(),
      doc.updatedByRoleId.toString(),
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
