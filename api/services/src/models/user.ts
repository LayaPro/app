import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: string; // tenantId the user belongs to (single tenant)
  userId: string; // UUID
  email: string;
  passwordHash?: string; // hashed password (optional for activation flow)
  passwordSalt?: string;
  firstName: string;
  lastName: string;
  roleId: string; // Reference to Role table
  isActive: boolean;
  isActivated?: boolean; // Email activation status
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  activationToken?: string | null; // Email activation token
  activationTokenExpires?: Date | null; // Token expiry
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  tokenVersion: number;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: String, required: true, index: true, ref: 'Tenant' },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    passwordSalt: { type: String },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    roleId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isActivated: { type: Boolean, default: false },
    lastLogin: { type: Date },
    activationToken: { type: String, default: null },
    activationTokenExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
export default User;
