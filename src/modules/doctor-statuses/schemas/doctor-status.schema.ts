import { Schema, Document, Types } from 'mongoose';
import { AvailabilityStatus } from '../enums/availability-status.enum';

export interface DoctorStatusDocument extends Document {
  doctorProfileId: Types.ObjectId;
  status: AvailabilityStatus;
  expectedAt: Date | null;
  expectedAtNote: string | null;
  updatedByAccountId: Types.ObjectId;
  updatedByRoleId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const DoctorStatusSchema = new Schema<DoctorStatusDocument>(
  {
    doctorProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(AvailabilityStatus),
      default: AvailabilityStatus.AVAILABLE,
      required: true,
    },
    expectedAt: { type: Date, default: null },
    expectedAtNote: { type: String, default: null },
    updatedByAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    updatedByRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  },
  { timestamps: true, collection: 'doctor_statuses' },
);

DoctorStatusSchema.index({ doctorProfileId: 1 });
DoctorStatusSchema.index({ status: 1 });
DoctorStatusSchema.index({ updatedByAccountId: 1 });
DoctorStatusSchema.index({ updatedByRoleId: 1 });
