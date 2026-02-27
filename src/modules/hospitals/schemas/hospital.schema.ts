import { Schema, Document, Types } from 'mongoose';

export interface HospitalDocument extends Document {
  accountId: Types.ObjectId;
  addressId: Types.ObjectId;
  name: string;
  slug: string;
  phone: string;
  email: string;
  coverPhotoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const HospitalSchema = new Schema<HospitalDocument>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      unique: true,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    coverPhotoUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'hospitals' },
);

HospitalSchema.index({ deletedAt: 1 });
