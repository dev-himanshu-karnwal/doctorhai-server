import { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  name: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema: Schema<UserDocument> = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'users' },
);
