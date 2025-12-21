import { Schema, model, Document } from 'mongoose';
import { Project as SharedProject } from 'laya-shared';

export interface IProject extends Document, SharedProject {}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    projectName: { type: String, required: true, trim: true },
    brideFirstName: { type: String, trim: true },
    groomFirstName: { type: String, trim: true },
    brideLastName: { type: String, trim: true },
    groomLastName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    budget: { type: Number },
    address: { type: String },
    referredBy: { type: String, trim: true },
    projectDeliveryStatusId: { type: String, index: true } // Reference to ProjectDeliveryStatus
  },
  { timestamps: true }
);

// Index for searching by project name
ProjectSchema.index({ projectName: 1, tenantId: 1 });

export const Project = model<IProject>('Project', ProjectSchema);
export default Project;
