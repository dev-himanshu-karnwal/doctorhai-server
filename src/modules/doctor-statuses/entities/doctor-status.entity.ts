import { AvailabilityStatus } from '../enums/availability-status.enum';

export class DoctorStatusEntity {
  constructor(
    public readonly id: string,
    public readonly doctorProfileId: string,
    public readonly status: AvailabilityStatus,
    public readonly expectedAt: Date | null,
    public readonly expectedAtNote: string | null,
    public readonly updatedByAccountId: string,
    public readonly updatedByRoleId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
