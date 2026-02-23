import { Schema, Document, Types } from 'mongoose';

export interface AccountRoleAssignmentDocument {
  roleId: Types.ObjectId;
  grantedBy: Types.ObjectId | null;
  grantedAt: Date;
}

export interface AccountDocument extends Document {
  loginType: string;
  loginValue: string;
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
    loginType: { type: String, enum: ['email', 'username'], required: true },
    loginValue: { type: String, required: true },
    passwordHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    passwordUpdatedAt: { type: Date, default: null },
    roles: { type: [AccountRoleAssignmentSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'accounts' },
);

AccountSchema.index({ loginType: 1, loginValue: 1 }, { unique: true });
AccountSchema.index({ deletedAt: 1 });
AccountSchema.index({ 'roles.roleId': 1 });
