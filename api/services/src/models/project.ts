import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  tenantId: string;
  projectName: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  budget?: number;
  address?: string;
  referredBy?: string;
  projectDeliveryStatusId?: string; // Reference to ProjectDeliveryStatus
  proposalId?: string; // Reference to the proposal this project was created from
  s3BucketName?: string;
  displayPic?: string;
  coverPhoto?: string;
  videoUrls?: string[]; // YouTube video URLs
  createdAt: Date;
  updatedAt: Date;
}

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
    projectDeliveryStatusId: { type: String, index: true }, // Reference to ProjectDeliveryStatus
    proposalId: { type: String, index: true }, // Reference to the proposal this project was created from
    s3BucketName: { type: String, unique: true, sparse: true },
    displayPic: { type: String },
    coverPhoto: { type: String },
    videoUrls: { type: [String], default: [] } // YouTube video URLs
  },
  { timestamps: true }
);

// Index for searching by project name
ProjectSchema.index({ projectName: 1, tenantId: 1 });

export const Project = model<IProject>('Project', ProjectSchema);
export default Project;
