import { Schema, model, Document } from 'mongoose';

export interface IProjectDeliveryStatus extends Document {
  statusId: string;
  tenantId: string;
  statusCode: string;
  step: number; // Sequential order of status
  lastUpdatedDate?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDeliveryStatusSchema = new Schema<IProjectDeliveryStatus>(
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
ProjectDeliveryStatusSchema.index({ statusCode: 1, tenantId: 1 }, { unique: true });

export const ProjectDeliveryStatus = model<IProjectDeliveryStatus>('ProjectDeliveryStatus', ProjectDeliveryStatusSchema);
export default ProjectDeliveryStatus;
