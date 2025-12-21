import { Schema, model, Document } from 'mongoose';
import { DeliveryStatus as SharedDeliveryStatus } from 'laya-shared';

export interface IDeliveryStatus extends Document, SharedDeliveryStatus {}

const DeliveryStatusSchema = new Schema<IDeliveryStatus>(
  {
    statusId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    statusCode: { type: String, required: true, trim: true },
    lastUpdatedDate: { type: Date },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index: status code must be unique within a tenant
DeliveryStatusSchema.index({ statusCode: 1, tenantId: 1 }, { unique: true });

export const DeliveryStatus = model<IDeliveryStatus>('DeliveryStatus', DeliveryStatusSchema);
export default DeliveryStatus;
