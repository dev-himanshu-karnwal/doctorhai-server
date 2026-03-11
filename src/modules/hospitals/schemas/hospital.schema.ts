import { Schema, Document, Types } from 'mongoose';

export interface HospitalDocument extends Document {
  accountId: Types.ObjectId;
  addressId: Types.ObjectId | null;
  name: string;
  slug: string;
  phone: string;
  email: string;
  coverPhotoUrl: string | null;
  isActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  type?: string | null;
  timeline?:
    | {
        day: string;
        opentime: string;
        closetime: string;
      }[]
    | null;
  facilities?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  public_view_count: number;
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
      required: false,
      default: null,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    coverPhotoUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    location: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
    },
    type: { type: String, required: false },
    timeline: [
      {
        day: { type: String, required: false },
        opentime: { type: String, required: false },
        closetime: { type: String, required: false },
      },
    ],
    facilities: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
    public_view_count: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'hospitals' },
);

HospitalSchema.index({ deletedAt: 1 });
