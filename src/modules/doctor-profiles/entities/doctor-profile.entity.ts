export class DoctorProfileEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly designation: string,
    public readonly specialization: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly addressId: string,
    public readonly accountId: string,
    public readonly slug: string,
    public readonly bio: string | null,
    public readonly profilePhotoUrl: string | null,
    public readonly createdBy: string | null,
    public readonly hospitalId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
