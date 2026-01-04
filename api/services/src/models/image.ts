import { Schema, model, Document } from 'mongoose';

export interface IImage extends Document {
  imageId: string;
  tenantId: string;
  projectId: string; // Reference to Project
  clientEventId: string; // Reference to ClientEvent
  
  // Storage
  originalUrl: string; // S3 URL for original
  compressedUrl?: string; // S3 URL for compressed version
  thumbnailUrl?: string; // S3 URL for thumbnail
  
  // Metadata
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: Date; // Original capture date from EXIF DateTimeOriginal
  editedAt?: Date; // Last modified date from EXIF DateTime
  
  // Status tracking
  uploadStatus: 'uploading' | 'completed' | 'failed';
  eventDeliveryStatusId?: string; // Reference to EventDeliveryStatus (same as event status)
  imageStatusId?: string; // Reference to ImageStatus
  
  // Features
  selectedByClient?: boolean; // Client selection
  markedAsFavorite?: boolean; // Marked favorite
  sortOrder?: number; // Custom sorting
  tags?: string[]; // Searchable tags
  comment?: string; // Comment for re-edit requests or feedback
  
  uploadedBy?: string;
  uploadedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    capturedAt: { type: Date }, // Original capture date from EXIF DateTimeOriginal
    editedAt: { type: Date }, // Last modified date from EXIF DateTime
    
    // Status tracking
    uploadStatus: { 
      type: String, 
      enum: ['uploading', 'completed', 'failed'],
      default: 'uploading',
      required: true 
    },
    eventDeliveryStatusId: { type: String, index: true }, // Reference to EventDeliveryStatus
    imageStatusId: { type: String, index: true }, // Reference to ImageStatus
    
    // Features
    selectedByClient: { type: Boolean, default: false },
    markedAsFavorite: { type: Boolean, default: false },
    sortOrder: { type: Number },
    tags: [{ type: String }],
    comment: { type: String }, // Comment for re-edit requests or feedback
    
    uploadedBy: { type: String },
    uploadedAt: { type: Date },
    approvedBy: { type: String },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ImageSchema.index({ tenantId: 1, projectId: 1, clientEventId: 1 });
ImageSchema.index({ tenantId: 1, uploadStatus: 1 });
ImageSchema.index({ clientEventId: 1, selectedByClient: 1 });
ImageSchema.index({ clientEventId: 1, markedAsFavorite: 1 });
ImageSchema.index({ clientEventId: 1, sortOrder: 1 });
ImageSchema.index({ clientEventId: 1, capturedAt: 1 });
ImageSchema.index({ clientEventId: 1, editedAt: 1 });

export const Image = model<IImage>('Image', ImageSchema);
export default Image;
