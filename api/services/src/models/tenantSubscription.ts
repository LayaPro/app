import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantSubscription extends Document {
  tenantId: string;
  planId: string; // reference to SubscriptionPlan
  storageUsed: number; // in bytes, calculated from images
  storageLimit: number; // in bytes, copied from plan for quick access
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED';
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  isAutoRenewal: boolean;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'FREE';
  lastStorageCalculatedAt?: Date; // timestamp of last storage calculation
  createdAt: Date;
  updatedAt: Date;
}

const tenantSubscriptionSchema = new Schema<ITenantSubscription>(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true, // one subscription per tenant
    },
    planId: {
      type: String,
      required: true,
    },
    storageUsed: {
      type: Number,
      required: true,
      default: 0,
      // stored in GB
    },
    storageLimit: {
      type: Number,
      required: true,
      // copied from plan, stored in GB
    },
    subscriptionStatus: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    renewalDate: {
      type: Date,
    },
    isAutoRenewal: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['PAID', 'PENDING', 'FAILED', 'FREE'],
      default: 'FREE',
    },
    lastStorageCalculatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
tenantSubscriptionSchema.index({ tenantId: 1 });
tenantSubscriptionSchema.index({ planId: 1 });
tenantSubscriptionSchema.index({ subscriptionStatus: 1 });

export const TenantSubscription = mongoose.model<ITenantSubscription>(
  'TenantSubscription',
  tenantSubscriptionSchema
);
