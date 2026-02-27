export class PermissionEntity {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
