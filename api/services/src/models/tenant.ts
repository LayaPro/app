import { Schema, model, Document } from 'mongoose';

export interface ITenant extends Document {
  tenantId: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string;
  tenantUsername: string;
  tenantEmailAddress: string;
  countryCode: string;
  tenantPhoneNumber: string;
  isActive: boolean;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  subscriptionPlan: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isInternal?: boolean;
}

const TenantSchema = new Schema<ITenant>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    tenantFirstName: { type: String, trim: true },
    tenantLastName: { type: String, trim: true },
    tenantCompanyName: { type: String, trim: true },
    tenantUsername: { type: String, required: true, trim: true, unique: true },
    tenantEmailAddress: { type: String, required: true, lowercase: true, trim: true, unique: true },
    countryCode: { type: String },
    tenantPhoneNumber: { type: String },
    isActive: { type: Boolean, default: true },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    subscriptionPlan: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    // legacy/extra fields kept for DB if needed
    isInternal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// using mongoose `timestamps: true` provides `createdAt` and `updatedAt`
export const Tenant = model<ITenant>('Tenant', TenantSchema);
export default Tenant;
