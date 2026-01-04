import { Schema, model, Document } from 'mongoose';

export interface IEventDeliveryStatus extends Document {
  statusId: string;
  tenantId: string;
  statusCode: string; // Uppercase with underscores (e.g., SHOOT_SCHEDULED)
  statusDescription: string; // Human-readable description
  statusExplaination?: string; // Internal note describing why the status exists
  statusCustomerNote?: string; // Customer-facing note shown to end clients
  step: number; // Sequential order of status
  isHidden: boolean; // Hidden statuses only shown when triggered
  lastUpdatedDate?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventDeliveryStatusSchema = new Schema<IEventDeliveryStatus>(
  {
    statusId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    statusCode: { type: String, required: true, trim: true },
    statusDescription: { type: String, required: true, trim: true },
    statusExplaination: { type: String, trim: true },
    statusCustomerNote: { type: String, trim: true },
    step: { type: Number, required: true },
    isHidden: { type: Boolean, default: false },
    lastUpdatedDate: { type: Date },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index: status code must be unique within a tenant
EventDeliveryStatusSchema.index({ statusCode: 1, tenantId: 1 }, { unique: true });

export const EventDeliveryStatus = model<IEventDeliveryStatus>('EventDeliveryStatus', EventDeliveryStatusSchema);
export default EventDeliveryStatus;
