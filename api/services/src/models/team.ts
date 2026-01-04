import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  memberId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  govtIdNumber?: string;
  roleId?: string; // Reference to Role for access level
  profileId?: string; // Reference to Profile (deprecated, use profileIds)
  profileIds?: string[]; // Array of Profile references
  userId?: string; // Reference to User for login access
  address?: string;
  isFreelancer: boolean;
  paymentType?: 'per-month' | 'per-event';
  salary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    memberId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },
    govtIdNumber: { type: String, trim: true },
    roleId: { type: String, index: true }, // Reference to Role
    profileId: { type: String, index: true }, // Reference to Profile (deprecated, use profileIds)
    profileIds: { type: [String], default: [] }, // Array of Profile references
    userId: { type: String, index: true }, // Reference to User for login
    address: { type: String },
    isFreelancer: { type: Boolean, required: true, default: false },
    paymentType: { type: String, enum: ['per-month', 'per-event'], trim: true },
    salary: { type: String, trim: true }
  },
  { timestamps: true }
);

// Compound index: email must be unique within a tenant
TeamSchema.index({ email: 1, tenantId: 1 }, { unique: true });

export const Team = model<ITeam>('Team', TeamSchema);
export default Team;
