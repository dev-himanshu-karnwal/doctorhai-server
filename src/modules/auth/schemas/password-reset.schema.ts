import { Schema, Document, Types } from 'mongoose';

export interface PasswordResetDocument extends Document {
  email: string;
  otpHash: string;
  accountIds: Types.ObjectId[];
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PasswordResetSchema = new Schema<PasswordResetDocument>(
  {
    email: { type: String, required: true },
    otpHash: { type: String, required: true },
    accountIds: [
      { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    ],
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'password_resets' },
);

PasswordResetSchema.index({ email: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
