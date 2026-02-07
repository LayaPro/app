import winston from 'winston';
import path from 'path';

/**
 * Dedicated logger for image operations
 * Tracks individual image uploads, processing, and operations
 * Separate from main application logs due to high volume
 */
export const imageLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Dedicated file for all image operations
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'images.log'),
      maxsize: 50 * 1024 * 1024, // 50MB per file
      maxFiles: 10, // Keep 10 files
      tailable: true
    }),
    // Separate file for image errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'images-error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB per file
      maxFiles: 5
    })
  ]
});

/**
 * Log individual image upload
 */
export const logImageUpload = (data: {
  requestId: string;
  tenantId: string;
  imageId: string;
  projectId: string;
  clientEventId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  originalUrl: string;
  compressedUrl?: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  processingTime?: number;
}) => {
  imageLogger.info('IMAGE_UPLOADED', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log batch upload completion
 */
export const logBatchUpload = (data: {
  requestId: string;
  tenantId: string;
  projectId: string;
  clientEventId: string;
  projectName?: string;
  eventName?: string;
  totalImages: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  uploadedBy?: string;
  processingTime: number;
}) => {
  imageLogger.info('BATCH_UPLOAD_COMPLETED', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log image deletion
 */
export const logImageDeletion = (data: {
  requestId: string;
  tenantId: string;
  imageId: string;
  projectId: string;
  clientEventId: string;
  fileName: string;
  deletedBy?: string;
}) => {
  imageLogger.info('IMAGE_DELETED', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log bulk image deletion
 */
export const logBulkDeletion = (data: {
  requestId: string;
  tenantId: string;
  projectId?: string;
  clientEventId?: string;
  imageIds: string[];
  count: number;
  deletedBy?: string;
}) => {
  imageLogger.info('BULK_DELETION_COMPLETED', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log image processing errors
 */
export const logImageError = (data: {
  requestId: string;
  tenantId: string;
  operation: string;
  fileName?: string;
  error: string;
  stack?: string;
}) => {
  imageLogger.error('IMAGE_ERROR', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log image approval
 */
export const logImageApproval = (data: {
  requestId: string;
  tenantId: string;
  clientEventId: string;
  imageIds: string[];
  count: number;
  approvedBy?: string;
}) => {
  imageLogger.info('IMAGES_APPROVED', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log client selection
 */
export const logClientSelection = (data: {
  requestId: string;
  tenantId: string;
  clientEventId: string;
  imageIds: string[];
  count: number;
  accessPin?: string;
}) => {
  imageLogger.info('CLIENT_SELECTION', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export default imageLogger;
