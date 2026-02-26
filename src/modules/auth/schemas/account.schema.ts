import { Schema, Document, Types } from 'mongoose';
import { LOGIN_TYPE } from '../dto';

export interface AccountRoleAssignmentDocument {
  roleId: Types.ObjectId;
  grantedBy: Types.ObjectId | null;
  grantedAt: Date;
}

export interface AccountDocument extends Document {
  loginType: string;
  email: string;
  username: string | null;
  passwordHash: string | null;
  isActive: boolean;
  passwordUpdatedAt: Date | null;
  roles: AccountRoleAssignmentDocument[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const AccountRoleAssignmentSchema = new Schema<AccountRoleAssignmentDocument>(
  {
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    grantedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

export const AccountSchema = new Schema<AccountDocument>(
  {
    loginType: { type: String, enum: LOGIN_TYPE, required: true },
    email: { type: String, required: true },
    username: { type: String, default: null },
    passwordHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    passwordUpdatedAt: { type: Date, default: null },
    roles: { type: [AccountRoleAssignmentSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'accounts' },
);

// Username must be globally unique when present.
AccountSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: 'string' } } },
);
// For email-based logins, ensure a single account per email.
AccountSchema.index(
  { loginType: 1, email: 1 },
  { unique: true, partialFilterExpression: { loginType: 'email' } },
);
AccountSchema.index({ deletedAt: 1 });
AccountSchema.index({ 'roles.roleId': 1 });
