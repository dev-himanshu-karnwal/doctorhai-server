import { Schema, Document } from 'mongoose';

export interface PermissionDocument extends Document {
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const PermissionSchema = new Schema<PermissionDocument>(
  {
    key: { type: String, required: true, unique: true },
    description: { type: String, default: null },
  },
  { timestamps: true, collection: 'permissions' },
);
