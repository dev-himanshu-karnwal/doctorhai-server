import { Schema, Document, Types } from 'mongoose';

export interface DoctorProfileDocument extends Document {
  fullName: string;
  designation: string;
  specialization: string;
  phone: string;
  email: string;
  addressId: Types.ObjectId;
  accountId: Types.ObjectId;
  slug: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdBy: Types.ObjectId | null;
  hospitalId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const DoctorProfileSchema = new Schema<DoctorProfileDocument>(
  {
    fullName: { type: String, required: true },
    designation: { type: String, required: true },
    specialization: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      unique: true,
    },
    slug: { type: String, required: true, unique: true },
    bio: { type: String, default: null },
    profilePhotoUrl: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'doctor_profiles' },
);

DoctorProfileSchema.index({ accountId: 1 });
DoctorProfileSchema.index({ slug: 1 });
DoctorProfileSchema.index({ hospitalId: 1 });
DoctorProfileSchema.index({ deletedAt: 1 });
