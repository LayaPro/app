import { Response } from 'express';
import archiver from 'archiver';
import { nanoid } from 'nanoid';
import Image from '../models/image';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Event from '../models/event';
import User from '../models/user';
import Role from '../models/role';
import ImageStatus from '../models/imageStatus';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Team from '../models/team';
import Tenant from '../models/tenant';
import { AuthRequest } from '../middleware/auth';
import { compressImage } from '../utils/imageProcessor';
import { uploadToS3, uploadBothVersions, bulkDeleteFromS3, getS3ObjectStreamFromUrl } from '../utils/s3';
import { getMainBucketName } from '../utils/s3Bucket';
import pMap from 'p-map';
import exifr from 'exifr';
import { NotificationUtils } from '../services/notificationUtils';
import { updateTenantStorageUsage } from '../utils/storageCalculator';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';
import { 
  logImageUpload, 
  logBatchUpload, 
  logImageDeletion, 
  logBulkDeletion, 
  logImageError, 
  logImageApproval, 
  logClientSelection 
} from '../utils/imageLogger';

const logger = createModuleLogger('ImageController');

export const createImage = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    projectId,
    clientEventId,
    originalUrl,
    compressedUrl,
    thumbnailUrl,
    fileName,
    fileSize,
    mimeType,
    width,
    height,
    eventDeliveryStatusId,
    tags
  } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating image`, { tenantId, fileName });

  try {
    if (!projectId || !clientEventId || !originalUrl || !fileName || !fileSize || !mimeType) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ 
        message: 'Project ID, Client Event ID, Original URL, File Name, File Size, and MIME Type are required' 
      });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const imageId = `image_${nanoid()}`;
    const image = await Image.create({
      imageId,
      tenantId,
      projectId,
      clientEventId,
      originalUrl,
      compressedUrl,
      thumbnailUrl,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      uploadStatus: 'completed',
      eventDeliveryStatusId,
      tags,
      uploadedBy: userId,
      uploadedAt: new Date()
    });

    logImageUpload({
      requestId,
      tenantId,
      imageId,
      projectId,
      clientEventId,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      originalUrl,
      compressedUrl,
      thumbnailUrl,
      uploadedBy: userId
    });

    logger.info(`[${requestId}] Image created`, { tenantId, imageId, fileName });

    // Update storage usage asynchronously
    updateTenantStorageUsage(tenantId)
      .then(storageUsed => logger.info(`[${requestId}] Storage updated`, { tenantId, storageUsedGB: storageUsed }))
      .catch(err => logger.error(`[${requestId}] Error updating storage`, { tenantId, error: err.message }));

    return res.status(201).json({
      message: 'Image created successfully',
      image
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating image`, { 
      tenantId,
      fileName,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkCreateImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { images } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Bulk creating images`, { tenantId, count: images?.length });

  try {
    if (!Array.isArray(images) || images.length === 0) {
      logger.warn(`[${requestId}] Images array missing or empty`, { tenantId });
      return res.status(400).json({ message: 'Images array is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get clientEventId from request - all images in bulk upload are for the same event
    const clientEventId = images[0]?.clientEventId;

    // Prepare images with IDs and tenant info
    const imagesToCreate = images.map((img) => ({
      imageId: `image_${nanoid()}`,
      tenantId,
      ...img,
      uploadedBy: userId,
      uploadedAt: new Date(),
      uploadStatus: 'completed'
    }));

    const createdImages = await Image.insertMany(imagesToCreate);

    logger.info(`[${requestId}] Bulk images created`, { tenantId, count: createdImages.length });

    // Check if we should update event status to REVIEW_ONGOING
    if (clientEventId) {
      const totalImagesForEvent = await Image.countDocuments({ clientEventId, tenantId });
      
      // If event now has at least 10 images, set status to REVIEW_ONGOING
      if (totalImagesForEvent >= 10) {
        // Get current event to check its status
        const currentEvent = await ClientEvent.findOne({ clientEventId, tenantId });
        const editingOngoingStatus = await EventDeliveryStatus.findOne({
          tenantId: { $in: [tenantId, -1] },
          statusCode: 'EDITING_ONGOING'
        });
        
        // Only update if current status is EDITING_ONGOING
        if (currentEvent && editingOngoingStatus && currentEvent.eventDeliveryStatusId === editingOngoingStatus.statusId) {
          const reviewStatus = await EventDeliveryStatus.findOne({
            tenantId: { $in: [tenantId, -1] },
            statusCode: 'REVIEW_ONGOING'
          });
          
          if (reviewStatus) {
            await ClientEvent.findOneAndUpdate(
              { clientEventId, tenantId },
              { 
                $set: { 
                  eventDeliveryStatusId: reviewStatus.statusId,
                  updatedBy: userId
                }
              }
            );
            logger.info(`[${requestId}] Event status updated to REVIEW_ONGOING`, { tenantId, clientEventId });
          }
        } else {
          logger.info(`[${requestId}] Event not in EDITING_ONGOING status, skipping update`, { tenantId, clientEventId });
        }
      }
    }

    // Update storage usage asynchronously
    updateTenantStorageUsage(tenantId)
      .then(storageUsed => logger.info(`[${requestId}] Storage updated`, { tenantId, storageUsedGB: storageUsed }))
      .catch(err => logger.error(`[${requestId}] Error updating storage`, { tenantId, error: err.message }));

    return res.status(201).json({
      message: `${createdImages.length} images created successfully`,
      count: createdImages.length,
      images: createdImages
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error bulk creating images`, { 
      tenantId,
      count: images?.length,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all images`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const images = await Image.find({ tenantId }).sort({ uploadedAt: -1 }).lean();

    logger.info(`[${requestId}] Images retrieved`, { tenantId, count: images.length });

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching images`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImagesByClientEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;
  const { selectedByClient, markedAsFavorite } = req.query;

  logger.info(`[${requestId}] Fetching images by client event`, { tenantId, clientEventId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if user has access to this event
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Non-admin users can only access events they're assigned to
    const isAdmin = roleName === 'Admin';
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      const memberId = teamMember?.memberId;
      
      // Check if user is assigned as team member, editor, or designer
      const isTeamMember = memberId && clientEvent.teamMembersAssigned?.includes(memberId);
      const isEditor = clientEvent.albumEditor === userId || (memberId && clientEvent.albumEditor === memberId);
      const isDesigner = clientEvent.albumDesigner === userId || (memberId && clientEvent.albumDesigner === memberId);
      
      if (!isTeamMember && !isEditor && !isDesigner) {
        logger.warn(`[${requestId}] Access denied`, { tenantId, clientEventId, userId });
        return res.status(403).json({ message: 'Access denied. You can only view images for events you are assigned to.' });
      }
    }

    const query: any = { clientEventId, tenantId };
    
    if (selectedByClient !== undefined) {
      query.selectedByClient = selectedByClient === 'true';
    }
    
    if (markedAsFavorite !== undefined) {
      query.markedAsFavorite = markedAsFavorite === 'true';
    }

    // Sort by sortOrder (manual reordering), then uploadedAt as fallback
    const images = await Image.find(query)
      .sort({ sortOrder: 1, uploadedAt: 1 })
      .lean();

    logger.info(`[${requestId}] Images retrieved by event`, { tenantId, clientEventId, count: images.length });

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching images by event`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImagesByProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching images by project`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'Admin';

    // For non-admin users, check if they have access to any events in this project
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember) {
        logger.warn(`[${requestId}] Access denied - not a team member`, { tenantId, projectId, userId });
        return res.status(403).json({ message: 'Access denied. You are not a team member.' });
      }

      const assignedEvents = await ClientEvent.find({ 
        projectId, 
        tenantId,
        teamMembersAssigned: teamMember.memberId 
      }).lean();

      if (assignedEvents.length === 0) {
        logger.warn(`[${requestId}] Access denied - no assigned events`, { tenantId, projectId, userId });
        return res.status(403).json({ message: 'Access denied. You have no assigned events in this project.' });
      }

      // Get images only from assigned events
      const assignedEventIds = assignedEvents.map(e => e.clientEventId);
      const images = await Image.find({ 
        projectId, 
        tenantId,
        clientEventId: { $in: assignedEventIds }
      }).sort({ uploadedAt: -1 }).lean();

      logger.info(`[${requestId}] Images retrieved for assigned events`, { tenantId, projectId, count: images.length });

      return res.status(200).json({
        message: 'Images retrieved successfully',
        count: images.length,
        images
      });
    }

    // Admin sees all images in the project
    const images = await Image.find({ projectId, tenantId }).sort({ uploadedAt: -1 }).lean();

    logger.info(`[${requestId}] Images retrieved`, { tenantId, projectId, count: images.length });

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching images by project`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImageById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching image by ID`, { tenantId, imageId });

  try {
    const image = await Image.findOne({ imageId });

    if (!image) {
      logger.warn(`[${requestId}] Image not found`, { tenantId, imageId });
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, imageId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant images.' });
    }

    logger.info(`[${requestId}] Image retrieved`, { tenantId, imageId });

    return res.status(200).json({ image });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching image`, { 
      tenantId,
      imageId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImageProperties = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching image properties`, { tenantId, imageId });

  try {
    const image = await Image.findOne({ imageId }).lean();

    if (!image) {
      logger.warn(`[${requestId}] Image not found`, { tenantId, imageId });
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, imageId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant images.' });
    }

    // Get status description by looking up ImageStatus
    let statusDescription = 'Unknown';
    if (image.imageStatusId) {
      const imageStatus = await ImageStatus.findOne({ statusId: image.imageStatusId }).lean();
      if (imageStatus) {
        statusDescription = imageStatus.statusDescription;
      }
    }

    // Return image properties
    const properties = {
      imageId: image.imageId,
      fileName: image.fileName,
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      status: statusDescription,
      capturedAt: image.capturedAt,
      editedAt: image.editedAt,
      uploadedAt: image.uploadedAt,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };

    logger.info(`[${requestId}] Image properties retrieved`, { tenantId, imageId });

    return res.status(200).json({ image: properties });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching image properties`, { 
      tenantId,
      imageId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const updateImage = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Updating image`, { tenantId, imageId });

  try {
    // Don't allow updating core fields
    delete updates.imageId;
    delete updates.tenantId;
    delete updates.projectId;
    delete updates.clientEventId;
    delete updates.uploadedBy;
    delete updates.uploadedAt;

    const image = await Image.findOne({ imageId });

    if (!image) {
      logger.warn(`[${requestId}] Image not found`, { tenantId, imageId });
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, imageId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant images.' });
    }

    const updatedImage = await Image.findOneAndUpdate(
      { imageId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Image updated`, { tenantId, imageId });

    return res.status(200).json({
      message: 'Image updated successfully',
      image: updatedImage
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating image`, { 
      tenantId,
      imageId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpdateImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds, updates } = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Bulk updating images`, { tenantId, count: imageIds?.length });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] Image IDs array missing or empty`, { tenantId });
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      logger.warn(`[${requestId}] Updates object missing`, { tenantId });
      return res.status(400).json({ message: 'Updates object is required' });
    }

    // Don't allow updating core fields
    delete updates.imageId;
    delete updates.tenantId;
    delete updates.projectId;
    delete updates.clientEventId;
    delete updates.uploadedBy;
    delete updates.uploadedAt;

    const result = await Image.updateMany(
      { imageId: { $in: imageIds }, tenantId },
      { $set: updates }
    );

    logger.info(`[${requestId}] Images bulk updated`, { 
      tenantId, 
      matched: result.matchedCount, 
      modified: result.modifiedCount 
    });

    return res.status(200).json({
      message: 'Images updated successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error bulk updating images`, { 
      tenantId,
      count: imageIds?.length,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting image`, { tenantId, imageId });

  try {
    const image = await Image.findOne({ imageId });

    if (!image) {
      logger.warn(`[${requestId}] Image not found`, { tenantId, imageId });
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, imageId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant images.' });
    }

    await Image.deleteOne({ imageId });

    logImageDeletion({
      requestId,
      tenantId,
      imageId,
      projectId: image.projectId,
      clientEventId: image.clientEventId,
      fileName: image.fileName,
      deletedBy: userId
    });

    logger.info(`[${requestId}] Image deleted`, { tenantId, imageId });

    // Update storage usage asynchronously
    if (tenantId) {
      updateTenantStorageUsage(tenantId).catch(err => 
        logger.error(`[${requestId}] Error updating storage`, { tenantId, error: err.message })
      );
    }

    return res.status(200).json({
      message: 'Image deleted successfully',
      imageId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting image`, { 
      tenantId,
      imageId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkDeleteImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Bulk deleting images`, { tenantId, count: imageIds?.length });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] Image IDs array missing or empty`, { tenantId });
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    // Fetch images to get S3 URLs before deleting
    const images = await Image.find({
      imageId: { $in: imageIds },
      tenantId
    }).lean();

    if (images.length === 0) {
      logger.warn(`[${requestId}] No images found to delete`, { tenantId, imageIds });
      return res.status(404).json({ message: 'No images found to delete' });
    }

    // Collect all S3 URLs (both original and compressed)
    const s3Urls: string[] = [];
    for (const image of images) {
      if (image.originalUrl) s3Urls.push(image.originalUrl);
      if (image.compressedUrl) s3Urls.push(image.compressedUrl);
      if (image.thumbnailUrl) s3Urls.push(image.thumbnailUrl);
    }

    // Delete from S3 (both standard and Glacier)
    if (s3Urls.length > 0) {
      await bulkDeleteFromS3(s3Urls);
      logger.info(`[${requestId}] S3 files deleted`, { tenantId, count: s3Urls.length });
    }

    // Delete from database
    const result = await Image.deleteMany({
      imageId: { $in: imageIds },
      tenantId
    });

    // Log bulk deletion
    logBulkDeletion({
      requestId,
      tenantId: tenantId!,
      projectId: images[0]?.projectId,
      clientEventId: images[0]?.clientEventId,
      imageIds,
      count: result.deletedCount,
      deletedBy: userId
    });

    logger.info(`[${requestId}] Images deleted from database`, { tenantId, count: result.deletedCount });

    // Update storage usage asynchronously
    if (tenantId) {
      updateTenantStorageUsage(tenantId)
        .then(storageUsed => logger.info(`[${requestId}] Storage updated`, { tenantId, storageUsedGB: storageUsed }))
        .catch(err => logger.error(`[${requestId}] Error updating storage`, { tenantId, error: err.message }));
    }

    return res.status(200).json({
      message: 'Images deleted successfully',
      deletedCount: result.deletedCount,
      s3FilesDeleted: s3Urls.length
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error bulk deleting images`, { 
      tenantId,
      count: imageIds?.length,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Batch upload endpoint with compression
export const uploadBatchImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const startTime = Date.now();
  const { projectId, clientEventId, eventDeliveryStatusId, skipNotification } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Starting batch image upload`, { tenantId, projectId, clientEventId });

  try {
    if (!projectId || !clientEventId) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId, projectId, clientEventId });
      return res.status(400).json({ 
        message: 'Project ID and Client Event ID are required' 
      });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      logger.warn(`[${requestId}] No images provided`, { tenantId });
      return res.status(400).json({ message: 'No images provided' });
    }

    logger.info(`[${requestId}] Processing ${files.length} images`, { tenantId, projectId, clientEventId });

    // Fetch project
    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get main bucket name
    const s3BucketName = await getMainBucketName();

    // Fetch tenant to get folder name
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant || !tenant.s3TenantFolderName) {
      return res.status(400).json({ message: 'Tenant S3 folder not configured' });
    }

    // Validate project has folder name
    if (!project.s3ProjectFolderName) {
      return res.status(400).json({ message: 'Project S3 folder not configured' });
    }

    // Fetch client event to get eventId
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Validate event has folder name
    if (!clientEvent.s3EventFolderName) {
      return res.status(400).json({ message: 'Event S3 folder not configured' });
    }

    // Build full folder path: tenant/project/event
    const folderPrefix = `${tenant.s3TenantFolderName}/${project.s3ProjectFolderName}/${clientEvent.s3EventFolderName}`;

    logger.info(`[${requestId}] S3 path configured`, { tenantId, bucket: s3BucketName, path: folderPrefix });

    // Fetch event to get event name
    const event = await Event.findOne({ eventId: clientEvent.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine image status based on user role
    const user = await User.findOne({ userId, tenantId });
    let imageStatusId: string | undefined;
    
    if (user) {
      const role = await Role.findOne({ roleId: user.roleId });
      if (role) {
        // All uploads go to REVIEW_PENDING status
        const statusCode = 'REVIEW_PENDING';
        const imageStatus = await ImageStatus.findOne({ statusCode, tenantId: { $in: [tenantId, -1] } });
        if (imageStatus) {
          imageStatusId = imageStatus.statusId;
        }
      }
    }


    // Get the current maximum sortOrder for this clientEventId
    const maxSortOrderImage = await Image.findOne({ clientEventId, tenantId })
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean();
    
    let nextSortOrder = (maxSortOrderImage?.sortOrder ?? -1) + 1;

    // Process images in batches of 15 for optimal performance
    const results = await pMap(
      files,
      async (file) => {
        const currentSortOrder = nextSortOrder++;
        try {
          // Get original buffer
          const originalBuffer = file.buffer;
          const originalMetadata = await require('sharp')(originalBuffer).metadata();

          // Extract dates from EXIF data using exifr
          let capturedAt: Date | undefined;
          let editedAt: Date | undefined;
          try {
            const exifData = await exifr.parse(originalBuffer, {
              pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'ModifyDate']
            });
            
            if (exifData) {
              // DateTimeOriginal or CreateDate - when photo was taken
              capturedAt = exifData.DateTimeOriginal || exifData.CreateDate;
              
              // DateTime or ModifyDate - last modified date
              editedAt = exifData.DateTime || exifData.ModifyDate;
            }
          } catch (exifError) {
            // EXIF parsing errors are not critical
          }

          // Compress image
          const compressed = await compressImage(originalBuffer, {
            maxWidth: 1920,
            quality: 80,
            format: 'jpeg',
          });

          // Upload original and compressed versions to main bucket
          const uploadResult = await uploadBothVersions(
            originalBuffer,
            compressed.buffer,
            file.originalname,
            file.mimetype,
            s3BucketName,
            folderPrefix
          );

          // Check if image with same filename already exists for this event
          const existingImage = await Image.findOne({
            clientEventId,
            tenantId,
            fileName: file.originalname
          });

          let image;
          if (existingImage) {
            // Update existing image record
            image = await Image.findOneAndUpdate(
              { imageId: existingImage.imageId },
              {
                originalUrl: uploadResult.originalUrl,
                compressedUrl: uploadResult.compressedUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                width: originalMetadata.width,
                height: originalMetadata.height,
                capturedAt: capturedAt,
                editedAt: editedAt,
                uploadStatus: 'completed',
                uploadedBy: userId,
                uploadedAt: new Date(),
              },
              { new: true }
            );
          } else {
            // Create new database record
            const imageId = `image_${nanoid()}`;
            image = await Image.create({
              imageId,
              tenantId,
              projectId,
              clientEventId,
              originalUrl: uploadResult.originalUrl,
              compressedUrl: uploadResult.compressedUrl,
              fileName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
              width: originalMetadata.width,
              height: originalMetadata.height,
              capturedAt: capturedAt,
              editedAt: editedAt,
              uploadStatus: 'completed',
              eventDeliveryStatusId,
              imageStatusId,
              sortOrder: currentSortOrder,
              uploadedBy: userId,
              uploadedAt: new Date(),
            });
          }

          // Log individual image upload to dedicated image log
          logImageUpload({
            requestId,
            tenantId,
            imageId: image?.imageId || existingImage?.imageId || 'unknown',
            projectId,
            clientEventId,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            width: originalMetadata.width,
            height: originalMetadata.height,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
            uploadedBy: userId
          });

          return {
            success: true,
            imageId: image?.imageId,
            fileName: file.originalname,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
          };
        } catch (error) {
          // Log error to dedicated image log
          logImageError({
            requestId,
            tenantId,
            operation: 'BATCH_UPLOAD',
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed',
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Create database record for failed upload
          try {
            const imageId = `image_${nanoid()}`;
            await Image.create({
              imageId,
              tenantId,
              projectId,
              clientEventId,
              originalUrl: '', // Empty since upload failed
              fileName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
              uploadStatus: 'failed',
              eventDeliveryStatusId,
              uploadedBy: userId,
              uploadedAt: new Date(),
            });
          } catch (dbError) {
            logger.error(`[${requestId}] Failed to save error record`, { 
              tenantId, 
              fileName: file.originalname, 
              error: dbError instanceof Error ? dbError.message : 'Unknown error' 
            });
          }
          
          return {
            success: false,
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed',
          };
        }
      },
      { concurrency: 15 } // Process 15 images at a time
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const processingTime = Date.now() - startTime;

    // Log batch completion to dedicated image log
    logBatchUpload({
      requestId,
      tenantId,
      projectId,
      clientEventId,
      projectName: project.projectName,
      eventName: event.eventDesc,
      totalImages: files.length,
      successfulUploads: successful.length,
      failedUploads: failed.length,
      totalSize: totalBytes,
      uploadedBy: userId,
      processingTime
    });

    logger.info(`[${requestId}] Batch upload completed`, { 
      tenantId, 
      successful: successful.length, 
      failed: failed.length,
      totalSizeMB: (totalBytes / (1024 * 1024)).toFixed(2),
      processingTimeMs: processingTime
    });

    // Send notification to admins if any images were successfully uploaded (unless explicitly skipped)
    // Also create audit log only when notification is sent (final batch)
    if (successful.length > 0 && !skipNotification) {
      try {
        // Get editor name
        const editorUser = await User.findOne({ userId, tenantId });
        const editorTeamMember = await Team.findOne({ userId, tenantId });
        const editorName = editorTeamMember 
          ? `${editorTeamMember.firstName} ${editorTeamMember.lastName}` 
          : editorUser?.email || 'Editor';

        // Project and event names already fetched above
        const projectName = project.projectName || 'Unknown Project';
        const eventName = event.eventDesc || 'Unknown Event';

        await NotificationUtils.notifyImagesUploaded(
          tenantId,
          editorName,
          projectName,
          eventName,
          successful.length,
          userId
        );
        logger.info(`[${requestId}] Notification sent`, { tenantId, editorName, imageCount: successful.length });

        // Create audit log only once when all images are uploaded (same condition as notification)
        logAudit({
          action: auditEvents.TENANT_UPDATED,
          entityType: 'Images',
          entityId: clientEventId,
          tenantId,
          performedBy: userId || 'System',
          changes: {},
          metadata: {
            operation: 'BATCH_UPLOAD',
            projectId,
            projectName: project.projectName,
            clientEventId,
            eventName: event.eventDesc,
            totalImages: files.length,
            successfulUploads: successful.length,
            failedUploads: failed.length,
            totalSizeBytes: totalBytes,
            processingTimeMs: processingTime
          },
          ipAddress: req.ip
        });
      } catch (notifError) {
        logger.error(`[${requestId}] Error sending notification`, { 
          tenantId, 
          error: notifError instanceof Error ? notifError.message : 'Unknown error' 
        });
        // Don't fail the request if notification fails
      }
    }

    // Check if we should update event status to REVIEW_ONGOING
    if (clientEventId && successful.length > 0) {
      const totalImagesForEvent = await Image.countDocuments({ clientEventId, tenantId });
      
      // If event now has at least 10 images, set status to REVIEW_ONGOING
      if (totalImagesForEvent >= 10) {
        // Get current event to check its status
        const currentEvent = await ClientEvent.findOne({ clientEventId, tenantId });
        const editingOngoingStatus = await EventDeliveryStatus.findOne({
          tenantId: { $in: [tenantId, -1] },
          statusCode: 'EDITING_ONGOING'
        });
        
        // Only update if current status is EDITING_ONGOING
        if (currentEvent && editingOngoingStatus && currentEvent.eventDeliveryStatusId === editingOngoingStatus.statusId) {
          const reviewStatus = await EventDeliveryStatus.findOne({
            tenantId: { $in: [tenantId, -1] },
            statusCode: 'REVIEW_ONGOING'
          });
          
          if (reviewStatus) {
            await ClientEvent.findOneAndUpdate(
              { clientEventId, tenantId },
              { 
                $set: { 
                  eventDeliveryStatusId: reviewStatus.statusId,
                  updatedBy: userId
                }
              }
            );
            logger.info(`[${requestId}] Event status updated to REVIEW_ONGOING`, { tenantId, clientEventId, totalImages: totalImagesForEvent });
          }
        }
      }
    }

    // Update storage usage asynchronously
    if (tenantId && successful.length > 0) {
      updateTenantStorageUsage(tenantId)
        .then(storageUsed => logger.info(`[${requestId}] Storage updated`, { tenantId, storageUsedGB: storageUsed }))
        .catch(err => logger.error(`[${requestId}] Error updating storage`, { tenantId, error: err.message }));
    }

    res.status(200).json({
      message: `Uploaded ${successful.length} of ${files.length} images`,
      successful,
      failed,
      stats: {
        total: files.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    logger.error(`[${requestId}] Batch upload error`, { 
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Failed to upload images', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const reorderImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId, imageIds } = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Reordering images`, { tenantId, clientEventId, count: imageIds?.length });

  try {
    if (!clientEventId || !imageIds || !Array.isArray(imageIds)) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ 
        message: 'Client Event ID and imageIds array are required' 
      });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Update sortOrder for each image
    const updatePromises = imageIds.map((imageId, index) => 
      Image.findOneAndUpdate(
        { imageId, tenantId, clientEventId },
        { sortOrder: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    logger.info(`[${requestId}] Images reordered`, { tenantId, clientEventId, count: imageIds.length });

    res.status(200).json({ 
      message: 'Images reordered successfully',
      imageIds 
    });
  } catch (error) {
    logger.error(`[${requestId}] Error reordering images`, { 
      tenantId,
      clientEventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Failed to reorder images', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Reupload edited images - updates existing records
export const reuploadImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  try {
    // Parse imageIds from FormData (sent as JSON string)
    let imageIds: string[] = [];
    if (req.body.imageIds) {
      try {
        imageIds = typeof req.body.imageIds === 'string' 
          ? JSON.parse(req.body.imageIds) 
          : req.body.imageIds;
      } catch (e) {
        logger.warn(`[${requestId}] Invalid image selection data`, { tenantId });
        return res.status(400).json({ 
          message: 'Invalid image selection data' 
        });
      }
    }

    logger.info(`[${requestId}] Reuploading images`, { tenantId, count: imageIds.length });

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] No images selected`, { tenantId });
      return res.status(400).json({ 
        message: 'Please select images to re-upload' 
      });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Unable to verify your account. Please log in again.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      logger.warn(`[${requestId}] No files provided`, { tenantId });
      return res.status(400).json({ message: 'Please select files to upload' });
    }

    // Fetch existing images
    const existingImages = await Image.find({ 
      imageId: { $in: imageIds },
      tenantId 
    }).lean();

    if (existingImages.length === 0) {
      return res.status(404).json({ message: 'Selected images not found. Please refresh and try again.' });
    }

    // Get project info for S3 bucket
    const firstImage = existingImages[0];
    const project = await Project.findOne({ projectId: firstImage.projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found. Please contact support.' });
    }

    // Get main bucket name
    const s3BucketName = await getMainBucketName();

    // Fetch tenant to get folder name
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant || !tenant.s3TenantFolderName) {
      return res.status(400).json({ message: 'Tenant S3 folder not configured' });
    }

    // Validate project has folder name
    if (!project.s3ProjectFolderName) {
      return res.status(400).json({ message: 'Project S3 folder not configured' });
    }

    // Get event info for folder name
    const clientEvent = await ClientEvent.findOne({ clientEventId: firstImage.clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Validate event has folder name
    if (!clientEvent.s3EventFolderName) {
      return res.status(400).json({ message: 'Event S3 folder not configured' });
    }

    const event = await Event.findOne({ eventId: clientEvent.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Build full folder path: tenant/project/event
    const folderPrefix = `${tenant.s3TenantFolderName}/${project.s3ProjectFolderName}/${clientEvent.s3EventFolderName}`;

    logger.info(`[${requestId}] Processing reupload`, { tenantId, path: folderPrefix, fileCount: files.length });

    // Get "Re-edit done" status
    const reEditDoneStatus = await ImageStatus.findOne({ 
      statusCode: 'RE_EDIT_DONE',
      tenantId: { $in: [tenantId, -1] }
    });

    if (!reEditDoneStatus) {
      logger.warn(`[${requestId}] RE_EDIT_DONE status not found`, { tenantId });
    } else {
      logger.info(`[${requestId}] RE_EDIT_DONE status found`, { tenantId, statusId: reEditDoneStatus.statusId });
    }

    // Create a map of filename -> existing image for matching
    const imagesByFilename = new Map<string, any>();
    existingImages.forEach(img => {
      imagesByFilename.set(img.fileName, img);
    });

    // Process each uploaded file
    const results = await pMap(
      files,
      async (file) => {
        try {
          // Find matching image by filename
          const existingImage = imagesByFilename.get(file.originalname);
          
          if (!existingImage) {
            return {
              success: false,
              fileName: file.originalname,
              message: 'No matching image found'
            };
          }

          // Get original buffer and metadata
          const originalBuffer = file.buffer;
          const originalMetadata = await require('sharp')(originalBuffer).metadata();

          // Extract EXIF dates
          let capturedAt: Date | undefined;
          let editedAt: Date | undefined;
          try {
            const exifData = await exifr.parse(originalBuffer, {
              pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'ModifyDate']
            });
            
            if (exifData) {
              capturedAt = exifData.DateTimeOriginal || exifData.CreateDate;
              editedAt = exifData.DateTime || exifData.ModifyDate;
            }
          } catch (exifError) {
            // EXIF parsing errors are not critical
          }

          // Compress image
          const compressed = await compressImage(originalBuffer, {
            maxWidth: 1920,
            quality: 80,
            format: 'jpeg',
          });

          // Upload and overwrite in S3
          const uploadResult = await uploadBothVersions(
            originalBuffer,
            compressed.buffer,
            file.originalname,
            file.mimetype,
            s3BucketName,
            folderPrefix
          );

          // Update existing image record
          const updateData: any = {
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
            fileSize: file.size,
            width: originalMetadata.width,
            height: originalMetadata.height,
            capturedAt: capturedAt || existingImage.capturedAt,
            editedAt: editedAt || new Date(),
            uploadStatus: 'completed',
            uploadedBy: userId,
            uploadedAt: new Date(),
          };

          // Always update to RE_EDIT_DONE status if available
          if (reEditDoneStatus) {
            updateData.imageStatusId = reEditDoneStatus.statusId;
          }

          await Image.findOneAndUpdate(
            { imageId: existingImage.imageId, tenantId },
            updateData
          );

          logImageUpload({
            requestId,
            tenantId,
            imageId: existingImage.imageId,
            projectId: existingImage.projectId,
            clientEventId: existingImage.clientEventId,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            width: originalMetadata.width,
            height: originalMetadata.height,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
            thumbnailUrl: undefined,
            uploadedBy: userId
          });

          return {
            success: true,
            imageId: existingImage.imageId,
            fileName: file.originalname,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
          };
        } catch (error) {
          logImageError({
            requestId,
            tenantId,
            operation: 'REUPLOAD',
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          });
          return {
            success: false,
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
        }
      },
      { concurrency: 15 }
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    logger.info(`[${requestId}] Reupload completed`, { 
      tenantId, 
      successful: successful.length, 
      failed: failed.length 
    });

    // Send notification to admins if any images were successfully reuploaded
    if (successful.length > 0) {
      try {
        // Get editor name
        const editorUser = await User.findOne({ userId, tenantId });
        const editorTeamMember = await Team.findOne({ userId, tenantId });
        
        const editorName = editorTeamMember 
          ? `${editorTeamMember.firstName} ${editorTeamMember.lastName}` 
          : editorUser?.email || 'Editor';

        await NotificationUtils.notifyReEditCompleted(
          tenantId,
          editorName,
          project.projectName,
          event.eventDesc,
          successful.length
        );
        logger.info(`[${requestId}] Re-edit notification sent`, { tenantId, editorName, count: successful.length });
      } catch (notifError) {
        logger.error(`[${requestId}] Error sending notification`, { 
          tenantId, 
          error: notifError instanceof Error ? notifError.message : 'Unknown error' 
        });
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Reupload completed',
      successful: successful.length,
      failed: failed.length,
      results,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error reuploading images`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve images endpoint
export const approveImages = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Approving images`, { tenantId, count: imageIds?.length });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] No images selected`, { tenantId });
      return res.status(400).json({ message: 'Please select images to approve' });
    }

    // Find the APPROVED status (which represents approved images)
    const approvedStatus = await ImageStatus.findOne({ 
      statusCode: 'APPROVED', 
      tenantId: { $in: [tenantId, -1] }
    });

    if (!approvedStatus) {
      logger.warn(`[${requestId}] APPROVED status not found`, { tenantId });
      return res.status(404).json({ message: 'Approved status not found in the system' });
    }

    // Verify all images belong to this tenant
    const images = await Image.find({
      imageId: { $in: imageIds },
      tenantId
    });

    if (images.length !== imageIds.length) {
      logger.warn(`[${requestId}] Some images not found`, { tenantId, requested: imageIds.length, found: images.length });
      return res.status(404).json({ 
        message: 'Some images not found. Please refresh and try again.' 
      });
    }

    // Update all images to APPROVED status
    const result = await Image.updateMany(
      { 
        imageId: { $in: imageIds }, 
        tenantId 
      },
      { 
        $set: { 
          imageStatusId: approvedStatus.statusId,
          approvedBy: userId,
          approvedAt: new Date()
        } 
      }
    );

    // Log image approval
    logImageApproval({
      requestId,
      tenantId: tenantId!,
      imageIds,
      approvedBy: userId,
      count: result.modifiedCount,
      clientEventId: images[0]?.clientEventId || ''
    });

    logger.info(`[${requestId}] Images approved`, { tenantId, count: result.modifiedCount });

    // Send notification to editor
    if (result.modifiedCount > 0 && images.length > 0) {
      try {
        // Get project and event info from first image
        const firstImage = images[0];
        const project = await Project.findOne({ projectId: firstImage.projectId, tenantId });
        const clientEvent = await ClientEvent.findOne({ clientEventId: firstImage.clientEventId, tenantId });
        const event = clientEvent ? await Event.findOne({ eventId: clientEvent.eventId }) : null;

        // Get editor userId if assigned
        if (clientEvent?.albumEditor) {
          const editorMember = await Team.findOne({ memberId: clientEvent.albumEditor, tenantId });
          if (editorMember?.userId) {
            // Get admin name
            const adminTeamMember = await Team.findOne({ userId, tenantId });
            const adminName = adminTeamMember 
              ? `${adminTeamMember.firstName} ${adminTeamMember.lastName}` 
              : 'Admin';

            const projectName = project?.projectName || 'Unknown Project';
            const eventName = event?.eventDesc || 'Unknown Event';

            await NotificationUtils.notifyImagesApproved(
              tenantId!,
              editorMember.userId,
              projectName,
              eventName,
              result.modifiedCount,
              adminName
            );
            logger.info(`[${requestId}] Approval notification sent`, { tenantId, editorUserId: editorMember.userId });
          }
        }
      } catch (notifError) {
        logger.error(`[${requestId}] Error sending notification`, { 
          tenantId, 
          error: notifError instanceof Error ? notifError.message : 'Unknown error' 
        });
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      message: 'Images approved successfully',
      approvedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error approving images`, { 
      tenantId,
      count: imageIds?.length,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ 
      message: 'An error occurred while approving images. Please try again.' 
    });
  }
};

const sanitizeZipFileName = (value?: string | null, fallback = 'file') => {
  const base = (value || fallback).toString().trim();
  return base.length > 0 ? base.replace(/[^a-zA-Z0-9-_]+/g, '_') : fallback;
};

const streamImagesAsZip = async (res: Response, images: any[], zipBaseName: string) => {
  const safeZipName = `${sanitizeZipFileName(zipBaseName, 'images')}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeZipName}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<void>((resolve, reject) => {
    archive.on('error', (error) => {
      reject(error);
    });

    res.on('error', (error) => {
      reject(error);
    });

    res.on('close', () => {
      resolve();
    });

    archive.pipe(res);

    (async () => {
      for (const image of images) {
        const sourceUrl = image.originalUrl || image.compressedUrl;
        if (!sourceUrl) {
          continue;
        }

        try {
          const stream = await getS3ObjectStreamFromUrl(sourceUrl);
          archive.append(stream, {
            name: sanitizeZipFileName(image.fileName || `${image.imageId}.jpg`, `${image.imageId}.jpg`),
          });
        } catch (error) {
          // Skip images that fail to stream
        }
      }

      await archive.finalize();
    })().catch(reject);
  });
};

export const downloadSelectedImagesZip = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds } = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Downloading selected images`, { tenantId, count: imageIds?.length });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] Image IDs array missing`, { tenantId });
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const images = await Image.find({
      imageId: { $in: imageIds },
      tenantId,
    })
      .sort({ sortOrder: 1, uploadedAt: 1 })
      .lean();

    const downloadableImages = images.filter((img) => img.originalUrl || img.compressedUrl);

    if (downloadableImages.length === 0) {
      return res.status(404).json({ message: 'No downloadable images found for the selected items' });
    }

    const zipName = `selected-${new Date().toISOString().split('T')[0]}`;
    await streamImagesAsZip(res, downloadableImages, zipName);
  } catch (error) {
    logger.error(`[${requestId}] Error downloading selected images`, { tenantId, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to download selected images' });
    }
    res.end();
  }
};

export const downloadEventImagesZip = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Downloading event images`, { tenantId, clientEventId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId }).lean();
    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    const images = await Image.find({ clientEventId, tenantId })
      .sort({ sortOrder: 1, uploadedAt: 1 })
      .lean();
    const downloadableImages = images.filter((img) => img.originalUrl || img.compressedUrl);

    if (downloadableImages.length === 0) {
      logger.warn(`[${requestId}] No downloadable images`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'No downloadable images found for this event' });
    }

    const project = await Project.findOne({ projectId: clientEvent.projectId, tenantId }).lean();
    const event = await Event.findOne({ eventId: clientEvent.eventId }).lean();

    const zipNameParts = [
      project?.projectName,
      event?.eventDesc,
      clientEvent.fromDatetime ? new Date(clientEvent.fromDatetime).toISOString().split('T')[0] : null,
      'images',
    ].filter(Boolean) as string[];

    logger.info(`[${requestId}] Streaming ${downloadableImages.length} event images`, { tenantId, clientEventId });

    await streamImagesAsZip(res, downloadableImages, zipNameParts.join('-') || `event-${clientEventId}`);

    logger.info(`[${requestId}] Download completed`, { tenantId, clientEventId, count: downloadableImages.length });
  } catch (error) {
    logger.error(`[${requestId}] Error downloading event images`, { 
      tenantId,
      clientEventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to download event images' });
    }
    res.end();
  }
};

// Mark images as selected by client (for customer portal)
export const markImagesAsClientSelected = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { imageIds, selected = true } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Marking images as client selected`, { tenantId, count: imageIds?.length, selected });

  try {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      logger.warn(`[${requestId}] Image IDs array missing`, { tenantId });
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Update images
    const result = await Image.updateMany(
      { imageId: { $in: imageIds }, tenantId },
      { $set: { selectedByClient: selected } }
    );

    // Get clientEventId from first image for logging
    const firstImage = await Image.findOne({ imageId: imageIds[0], tenantId }).lean();

    logClientSelection({
      requestId,
      tenantId,
      imageIds,
      count: result.modifiedCount,
      clientEventId: firstImage?.clientEventId || ''
    });

    logger.info(`[${requestId}] Images marked as client selected`, { 
      tenantId, 
      count: result.modifiedCount, 
      selected 
    });

    return res.status(200).json({
      message: `${result.modifiedCount} image(s) ${selected ? 'selected' : 'deselected'} by client`,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error marking images as client selected`, { 
      tenantId,
      count: imageIds?.length,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Finalize client selection - sets event status to CLIENT_SELECTION_DONE
export const finalizeClientSelection = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Finalizing client selection`, { tenantId, clientEventId });

  try {
    if (!clientEventId) {
      logger.warn(`[${requestId}] Client Event ID missing`, { tenantId });
      return res.status(400).json({ message: 'Client Event ID is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Verify event exists
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Find CLIENT_SELECTION_DONE status
    const selectionDoneStatus = await EventDeliveryStatus.findOne({
      tenantId,
      statusCode: 'CLIENT_SELECTION_DONE'
    });

    if (!selectionDoneStatus) {
      logger.warn(`[${requestId}] CLIENT_SELECTION_DONE status not found`, { tenantId });
      return res.status(404).json({ message: 'CLIENT_SELECTION_DONE status not found in system' });
    }

    // Update event status
    await ClientEvent.findOneAndUpdate(
      { clientEventId, tenantId },
      {
        $set: {
          eventDeliveryStatusId: selectionDoneStatus.statusId,
          updatedBy: userId
        }
      }
    );

    // Get count of selected images for confirmation
    const selectedCount = await Image.countDocuments({
      clientEventId,
      tenantId,
      selectedByClient: true
    });

    logger.info(`[${requestId}] Client selection finalized`, { tenantId, clientEventId, selectedCount });

    return res.status(200).json({
      message: 'Client selection finalized successfully',
      clientEventId,
      selectedImagesCount: selectedCount,
      statusId: selectionDoneStatus.statusId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error finalizing client selection`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const notifyImagesUploaded = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId, clientEventId, imageCount } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Sending images uploaded notification`, { tenantId, projectId, clientEventId, imageCount });

  try {
    if (!projectId || !clientEventId || !imageCount) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Project ID, Client Event ID, and image count are required' });
    }

    if (!tenantId || !userId) {
      logger.warn(`[${requestId}] Tenant ID or User ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }

    // Get project, event, and editor info
    const project = await Project.findOne({ projectId, tenantId });
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    const event = clientEvent ? await Event.findOne({ eventId: clientEvent.eventId }) : null;
    
    const editorUser = await User.findOne({ userId, tenantId });
    const editorTeamMember = await Team.findOne({ userId, tenantId });
    const editorName = editorTeamMember 
      ? `${editorTeamMember.firstName} ${editorTeamMember.lastName}` 
      : editorUser?.email || 'Editor';

    const projectName = project?.projectName || 'Unknown Project';
    const eventName = event?.eventDesc || 'Unknown Event';

    await NotificationUtils.notifyImagesUploaded(
      tenantId,
      editorName,
      projectName,
      eventName,
      parseInt(imageCount),
      userId
    );

    logger.info(`[${requestId}] Notification sent`, { tenantId, editorName, imageCount });

    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    logger.error(`[${requestId}] Error sending notification`, { 
      tenantId,
      projectId,
      clientEventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Failed to send notification', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const notifyReEditRequested = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId, clientEventId, imageCount } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Sending re-edit requested notification`, { tenantId, projectId, clientEventId, imageCount });

  try {
    if (!projectId || !clientEventId || !imageCount) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Project ID, Client Event ID, and image count are required' });
    }

    if (!tenantId || !userId) {
      logger.warn(`[${requestId}] Tenant ID or User ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }

    // Get project, event, editor, and admin info
    const project = await Project.findOne({ projectId, tenantId });
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    const event = clientEvent ? await Event.findOne({ eventId: clientEvent.eventId }) : null;

    if (!clientEvent?.albumEditor) {
      logger.warn(`[${requestId}] No editor assigned`, { tenantId, clientEventId });
      return res.status(400).json({ message: 'No editor assigned to this event' });
    }

    // Get editor's userId from their memberId
    const editorMember = await Team.findOne({ memberId: clientEvent.albumEditor, tenantId });
    if (!editorMember?.userId) {
      logger.warn(`[${requestId}] Editor user account not found`, { tenantId, clientEventId });
      return res.status(400).json({ message: 'Editor user account not found' });
    }

    // Get admin name
    const adminUser = await User.findOne({ userId, tenantId });
    const adminTeamMember = await Team.findOne({ userId, tenantId });
    
    const adminName = adminTeamMember
      ? `${adminTeamMember.firstName} ${adminTeamMember.lastName}`
      : 'Admin';

    const projectName = project?.projectName || 'Unknown Project';
    const eventName = event?.eventDesc || 'Unknown Event';

    await NotificationUtils.notifyReEditRequested(
      tenantId,
      editorMember.userId,
      projectName,
      eventName,
      parseInt(imageCount),
      adminName
    );

    logger.info(`[${requestId}] Re-edit notification sent`, { tenantId, editorUserId: editorMember.userId, imageCount });

    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    logger.error(`[${requestId}] Error sending re-edit notification`, { 
      tenantId,
      projectId,
      clientEventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      message: 'Failed to send notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  createImage,
  bulkCreateImages,
  getAllImages,
  getImagesByClientEvent,
  getImagesByProject,
  getImageById,
  getImageProperties,
  updateImage,
  bulkUpdateImages,
  deleteImage,
  bulkDeleteImages,
  uploadBatchImages,
  reorderImages,
  reuploadImages,
  approveImages,
  downloadSelectedImagesZip,
  downloadEventImagesZip,
  markImagesAsClientSelected,
  finalizeClientSelection,
  notifyImagesUploaded,
  notifyReEditRequested,
};
