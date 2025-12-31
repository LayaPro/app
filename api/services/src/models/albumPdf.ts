import { Schema, model, Document } from 'mongoose';

export interface IAlbumPdf extends Document {
  albumId: string;
  tenantId: string;
  projectId: string;
  albumStatus: 'uploaded' | 'approved';
  eventIds: string[];
  isMultipleEvents: boolean;
  albumPdfUrl: string;
  albumPdfFileName: string;
  uploadedDate: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumPdfSchema = new Schema<IAlbumPdf>(
  {
    albumId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    albumStatus: { 
      type: String, 
      enum: ['uploaded', 'approved'],
      default: 'uploaded',
      required: true 
    },
    eventIds: [{ type: String, required: true }],
    isMultipleEvents: { type: Boolean, required: true, default: false },
    albumPdfUrl: { type: String, required: true },
    albumPdfFileName: { type: String, required: true },
    uploadedDate: { type: Date, default: Date.now, required: true },
    uploadedBy: { type: String, required: true }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
AlbumPdfSchema.index({ tenantId: 1, projectId: 1 });
AlbumPdfSchema.index({ tenantId: 1, projectId: 1, isMultipleEvents: 1 });
AlbumPdfSchema.index({ projectId: 1, albumStatus: 1 });
AlbumPdfSchema.index({ eventIds: 1 });

export const AlbumPdf = model<IAlbumPdf>('AlbumPdf', AlbumPdfSchema);
export default AlbumPdf;
