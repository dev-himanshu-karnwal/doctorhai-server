import { PasswordResetEntity } from '../entities';

export interface PasswordResetDocLike {
  _id: { toString(): string };
  email: string;
  otpHash: string;
  accountIds: { toString(): string }[];
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PasswordResetMapper {
  static toDomain(doc: PasswordResetDocLike): PasswordResetEntity {
    const accountIds = doc.accountIds.map((id) => id.toString());
    return new PasswordResetEntity(
      doc._id.toString(),
      doc.email,
      doc.otpHash,
      accountIds,
      doc.expiresAt,
      doc.verified,
      doc.attempts,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
