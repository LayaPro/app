import { Schema, model, Document } from 'mongoose';
import { User as SharedUser } from 'laya-shared';

export interface IUser extends Document, SharedUser {
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
