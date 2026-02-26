import type { ClientSession } from 'mongoose';
import { PasswordResetEntity } from '../entities';

export interface CreatePasswordResetInput {
  email: string;
  otpHash: string;
  accountIds: string[];
  expiresAt: Date;
}

export interface IPasswordResetRepository {
  create(
    data: CreatePasswordResetInput,
    session?: ClientSession,
  ): Promise<PasswordResetEntity>;

  findLatestActiveByEmail(email: string): Promise<PasswordResetEntity | null>;

  saveAttemptsAndVerification(
    id: string,
    attempts: number,
    verified: boolean,
  ): Promise<PasswordResetEntity>;

  deleteAllByEmail(email: string): Promise<void>;
}
