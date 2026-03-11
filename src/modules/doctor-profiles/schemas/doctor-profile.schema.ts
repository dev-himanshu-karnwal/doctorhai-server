import { Schema, Document, Types } from 'mongoose';

export interface DoctorProfileDocument extends Document {
  fullName: string;
  designation: string | null;
  specialization: string | null;
  phone: string;
  email: string;
  addressId: Types.ObjectId | null;
  accountId: Types.ObjectId;
  slug: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdBy: Types.ObjectId | null;
  hospitalId: Types.ObjectId | null;
  hasExperience: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  public_view_count: number;
}

export const DoctorProfileSchema = new Schema<DoctorProfileDocument>(
  {
    fullName: { type: String, required: true },
    designation: { type: String, required: false, default: null },
    specialization: { type: String, required: false, default: null },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: false,
      default: null,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      unique: true,
    },
    slug: { type: String, required: true, unique: true },
    bio: { type: String, required: false, default: null },
    profilePhotoUrl: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
    hasExperience: { type: String, required: false, default: null },
    deletedAt: { type: Date, default: null },
    public_view_count: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'doctor_profiles' },
);

DoctorProfileSchema.index({ hospitalId: 1 });
DoctorProfileSchema.index({ deletedAt: 1 });
// Email unique per profile type: one per individual (hospitalId null), one per hospital
DoctorProfileSchema.index(
  { email: 1, hospitalId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
