export class HospitalEntity {
  constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly addressId: string | null,
    public readonly name: string,
    public readonly slug: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly coverPhotoUrl: string | null,
    public readonly isActive: boolean,
    public readonly location: {
      latitude: number;
      longitude: number;
    } | null,
    public readonly type: string | null,
    public readonly timeline:
      | {
          day: string;
          opentime: string;
          closetime: string;
        }[]
      | null,
    public readonly facilities: string[] | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
