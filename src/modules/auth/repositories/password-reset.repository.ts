import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { PasswordResetDocument } from '../schemas';
import { PasswordResetMapper } from '../mappers';
import type {
  CreatePasswordResetInput,
  IPasswordResetRepository,
} from '../interfaces/password-reset-repository.interface';
import { PasswordResetEntity } from '../entities';

@Injectable()
export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(
    @InjectModel('PasswordReset')
    private readonly passwordResetModel: Model<PasswordResetDocument>,
  ) {}

  async create(
    data: CreatePasswordResetInput,
    session?: ClientSession,
  ): Promise<PasswordResetEntity> {
    const doc = await this.passwordResetModel.create(
      [
        {
          email: data.email.toLowerCase().trim(),
          otpHash: data.otpHash,
          accountIds: data.accountIds,
          expiresAt: data.expiresAt,
        },
      ],
      session ? { session } : {},
    );
    return PasswordResetMapper.toDomain(doc[0]);
  }

  async findLatestActiveByEmail(
    email: string,
  ): Promise<PasswordResetEntity | null> {
    const now = new Date();
    const doc = await this.passwordResetModel
      .findOne({
        email: email.toLowerCase().trim(),
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .exec();
    return doc ? PasswordResetMapper.toDomain(doc) : null;
  }

  async saveAttemptsAndVerification(
    id: string,
    attempts: number,
    verified: boolean,
  ): Promise<PasswordResetEntity> {
    const doc = await this.passwordResetModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { attempts, verified, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!doc) {
      // Repository returns a minimal entity to avoid leaking persistence details.
      throw new Error('Password reset record not found');
    }
    return PasswordResetMapper.toDomain(doc);
  }

  async deleteAllByEmail(email: string): Promise<void> {
    await this.passwordResetModel
      .deleteMany({ email: email.toLowerCase().trim() })
      .exec();
  }
}
