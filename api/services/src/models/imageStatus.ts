import { Schema, model, Document } from 'mongoose';

export interface IImageStatus extends Document {
  statusId: string;
  tenantId: string;
  statusCode: string; // Uppercase with underscores (e.g., UPLOADED, REVIEW_PENDING)
  statusDescription: string; // Human-readable description
  step: number; // Sequential order of status
  createdAt: Date;
  updatedAt: Date;
}

const ImageStatusSchema = new Schema<IImageStatus>(
  {
    statusId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    statusCode: { type: String, required: true, trim: true },
    statusDescription: { type: String, required: true, trim: true },
    step: { type: Number, required: true }
  },
  { timestamps: true }
);

// Compound index: status code must be unique within a tenant
ImageStatusSchema.index({ statusCode: 1, tenantId: 1 }, { unique: true });

export const ImageStatus = model<IImageStatus>('ImageStatus', ImageStatusSchema);
export default ImageStatus;
