export class AddressEntity {
  constructor(
    public readonly id: string,
    public readonly accountId: string | null,
    public readonly addressLine1: string,
    public readonly addressLine2: string | null,
    public readonly city: string,
    public readonly state: string,
    public readonly pincode: string,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
