import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  tenantId: string;
  projectName: string;
  contactPerson?: string;
  email?: string;
  brideFirstName?: string;
  groomFirstName?: string;
  brideLastName?: string;
  groomLastName?: string;
  phoneNumber?: string;
  budget?: number;
  address?: string;
  city?: string;
  referredBy?: string;
  deliveryDueDate?: Date;
  projectDeliveryStatusId?: string; // Reference to ProjectDeliveryStatus
  proposalId?: string; // Reference to the proposal this project was created from
  s3BucketName?: string;
  displayPic?: string;
  coverPhoto?: string;
  mobileCoverUrl?: string; // Mobile cover image URL
  tabletCoverUrl?: string; // Tablet cover image URL
  desktopCoverUrl?: string; // Desktop cover image URL
  videoUrls?: string[]; // YouTube video URLs
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    projectName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    brideFirstName: { type: String, trim: true },
    groomFirstName: { type: String, trim: true },
    brideLastName: { type: String, trim: true },
    groomLastName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    budget: { type: Number },
    address: { type: String },
    city: { type: String, trim: true },
    referredBy: { type: String, trim: true },
    deliveryDueDate: { type: Date },
    projectDeliveryStatusId: { type: String, index: true }, // Reference to ProjectDeliveryStatus
    proposalId: { type: String, index: true }, // Reference to the proposal this project was created from
    s3BucketName: { type: String, unique: true, sparse: true },
    displayPic: { type: String },
    coverPhoto: { type: String },
    mobileCoverUrl: { type: String },
    tabletCoverUrl: { type: String },
    desktopCoverUrl: { type: String },
    videoUrls: { type: [String], default: [] } // YouTube video URLs
  },
  { timestamps: true }
);

// Index for searching by project name
ProjectSchema.index({ projectName: 1, tenantId: 1 });

export const Project = model<IProject>('Project', ProjectSchema);
export default Project;
