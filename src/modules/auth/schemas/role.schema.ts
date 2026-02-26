import { Schema, Document, Types } from 'mongoose';

export interface RoleDocument extends Document {
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    isSystem: { type: Boolean, default: false },
    permissions: [
      { type: Schema.Types.ObjectId, ref: 'Permission', default: [] },
    ],
  },
  { timestamps: true, collection: 'roles' },
);

RoleSchema.index({ permissions: 1 });
