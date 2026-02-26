export class PasswordResetEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly otpHash: string,
    public readonly accountIds: string[],
    public readonly expiresAt: Date,
    public readonly verified: boolean,
    public readonly attempts: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
