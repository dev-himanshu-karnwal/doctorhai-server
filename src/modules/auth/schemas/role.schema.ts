import { Schema, Document, Types } from 'mongoose';

export interface RoleDocument extends Document {
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    isSystem: { type: Boolean, default: false },
    permissionIds: [
      { type: Schema.Types.ObjectId, ref: 'Permission', default: [] },
    ],
  },
  { timestamps: true, collection: 'roles' },
);

RoleSchema.index({ name: 1 });
RoleSchema.index({ permissionIds: 1 });
