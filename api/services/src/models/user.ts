import { Schema, model, Document } from 'mongoose';
import { User as SharedUser } from '@laya/shared';

export interface IUser extends Document, SharedUser {
  tokenVersion: number;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: String, required: true, index: true, ref: 'Tenant' },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
export default User;
