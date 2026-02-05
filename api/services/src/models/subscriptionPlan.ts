import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  planId: string;
  planName: string;
  planCode: string; // FREE, BASIC, PROFESSIONAL, BUSINESS, ENTERPRISE
  storageLimit: number; // in bytes
  storageDisplayGB: number; // for display purposes
  price: number; // monthly price in your currency
  currency: string;
  features: string[]; // array of feature descriptions
  isActive: boolean;
  displayOrder: number; // for sorting in UI
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planCode: {
      type: String,
      required: true,
      unique: true,
      enum: ['FREE', 'BASIC', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    },
    storageLimit: {
      type: Number,
      required: true,
      // stored in GB
    },
    storageDisplayGB: {
      type: Number,
      required: true,
      // human-readable GB value
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
