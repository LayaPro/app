export interface Image {
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
  
  // Features
  selectedByClient?: boolean; // Client selection
  markedAsFavorite?: boolean; // Marked favorite
  sortOrder?: number; // Custom sorting
  tags?: string[]; // Searchable tags
  
  uploadedBy?: string;
  uploadedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
