import { Schema, model, Document } from 'mongoose';
import { EventDeliveryStatus as SharedEventDeliveryStatus } from 'laya-shared';

export interface IEventDeliveryStatus extends Document, SharedEventDeliveryStatus {}

const EventDeliveryStatusSchema = new Schema<IEventDeliveryStatus>(
  {
    statusId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    statusCode: { type: String, required: true, trim: true },
    step: { type: Number, required: true },
    lastUpdatedDate: { type: Date },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

// Compound index: status code must be unique within a tenant
EventDeliveryStatusSchema.index({ statusCode: 1, tenantId: 1 }, { unique: true });

export const EventDeliveryStatus = model<IEventDeliveryStatus>('EventDeliveryStatus', EventDeliveryStatusSchema);
export default EventDeliveryStatus;
