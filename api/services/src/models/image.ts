import { Schema, model, Document } from 'mongoose';
import { Image as SharedImage } from 'laya-shared';

export interface IImage extends Document, SharedImage {}

const ImageSchema = new Schema<IImage>(
  {
    imageId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    clientEventId: { type: String, required: true, index: true },
    
    // Storage
    originalUrl: { type: String, required: true },
    compressedUrl: { type: String },
    thumbnailUrl: { type: String },
    
    // Metadata
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    
    // Status tracking
    uploadStatus: { 
      type: String, 
      enum: ['uploading', 'completed', 'failed'],
      default: 'uploading',
      required: true 
    },
    eventDeliveryStatusId: { type: String, index: true }, // Reference to EventDeliveryStatus
    
    // Features
    selectedByClient: { type: Boolean, default: false },
    markedAsFavorite: { type: Boolean, default: false },
    sortOrder: { type: Number },
    tags: [{ type: String }],
    
    uploadedBy: { type: String },
    uploadedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ImageSchema.index({ tenantId: 1, projectId: 1, clientEventId: 1 });
ImageSchema.index({ tenantId: 1, uploadStatus: 1 });
ImageSchema.index({ clientEventId: 1, selectedByClient: 1 });
ImageSchema.index({ clientEventId: 1, markedAsFavorite: 1 });
ImageSchema.index({ clientEventId: 1, sortOrder: 1 });

export const Image = model<IImage>('Image', ImageSchema);
export default Image;
