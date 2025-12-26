import { Response } from 'express';
import { nanoid } from 'nanoid';
import Image from '../models/image';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Event from '../models/event';
import { AuthRequest } from '../middleware/auth';
import { compressImage } from '../utils/imageProcessor';
import { uploadToS3, uploadBothVersions } from '../utils/s3';
import pMap from 'p-map';

export const createImage = async (req: AuthRequest, res: Response) => {
  try {
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

    if (!projectId || !clientEventId || !originalUrl || !fileName || !fileSize || !mimeType) {
      return res.status(400).json({ 
        message: 'Project ID, Client Event ID, Original URL, File Name, File Size, and MIME Type are required' 
      });
    }

    if (!tenantId) {
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

    return res.status(201).json({
      message: 'Image created successfully',
      image
    });
  } catch (err: any) {
    console.error('Create image error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkCreateImages = async (req: AuthRequest, res: Response) => {
  try {
    const { images } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Images array is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

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

    return res.status(201).json({
      message: `${createdImages.length} images created successfully`,
      count: createdImages.length,
      images: createdImages
    });
  } catch (err: any) {
    console.error('Bulk create images error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllImages = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const images = await Image.find({ tenantId }).sort({ uploadedAt: -1 }).lean();

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    console.error('Get all images error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImagesByClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;
    const { selectedByClient, markedAsFavorite } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const query: any = { clientEventId, tenantId };
    
    if (selectedByClient !== undefined) {
      query.selectedByClient = selectedByClient === 'true';
    }
    
    if (markedAsFavorite !== undefined) {
      query.markedAsFavorite = markedAsFavorite === 'true';
    }

    const images = await Image.find(query).sort({ sortOrder: 1, uploadedAt: 1 }).lean();

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    console.error('Get images by client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImagesByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const images = await Image.find({ projectId, tenantId }).sort({ uploadedAt: -1 }).lean();

    return res.status(200).json({
      message: 'Images retrieved successfully',
      count: images.length,
      images
    });
  } catch (err: any) {
    console.error('Get images by project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImageById = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const tenantId = req.user?.tenantId;

    const image = await Image.findOne({ imageId });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant images.' });
    }

    return res.status(200).json({ image });
  } catch (err: any) {
    console.error('Get image error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating core fields
    delete updates.imageId;
    delete updates.tenantId;
    delete updates.projectId;
    delete updates.clientEventId;
    delete updates.uploadedBy;
    delete updates.uploadedAt;

    const image = await Image.findOne({ imageId });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant images.' });
    }

    const updatedImage = await Image.findOneAndUpdate(
      { imageId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Image updated successfully',
      image: updatedImage
    });
  } catch (err: any) {
    console.error('Update image error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpdateImages = async (req: AuthRequest, res: Response) => {
  try {
    const { imageIds, updates } = req.body;
    const tenantId = req.user?.tenantId;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    if (!updates || typeof updates !== 'object') {
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

    return res.status(200).json({
      message: 'Images updated successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('Bulk update images error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const tenantId = req.user?.tenantId;

    const image = await Image.findOne({ imageId });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant images.' });
    }

    await Image.deleteOne({ imageId });

    return res.status(200).json({
      message: 'Image deleted successfully',
      imageId
    });
  } catch (err: any) {
    console.error('Delete image error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkDeleteImages = async (req: AuthRequest, res: Response) => {
  try {
    const { imageIds } = req.body;
    const tenantId = req.user?.tenantId;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: 'Image IDs array is required' });
    }

    const result = await Image.deleteMany({
      imageId: { $in: imageIds },
      tenantId
    });

    return res.status(200).json({
      message: 'Images deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (err: any) {
    console.error('Bulk delete images error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Batch upload endpoint with compression
export const uploadBatchImages = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, clientEventId, eventDeliveryStatusId } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!projectId || !clientEventId) {
      return res.status(400).json({ 
        message: 'Project ID and Client Event ID are required' 
      });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Fetch project to get S3 bucket name
    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const s3BucketName = project.s3BucketName;
    if (!s3BucketName) {
      return res.status(400).json({ message: 'Project does not have an S3 bucket configured' });
    }

    // Fetch client event to get eventId
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Fetch event to get event name
    const event = await Event.findOne({ eventId: clientEvent.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Sanitize event name for folder (remove special chars, spaces to hyphens)
    const eventFolderName = event.eventDesc
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    console.log(`Starting batch upload of ${files.length} images to bucket: ${s3BucketName}, folder: ${eventFolderName}...`);

    // Process images in batches of 15 for optimal performance
    const results = await pMap(
      files,
      async (file) => {
        try {
          // Get original buffer
          const originalBuffer = file.buffer;
          const originalMetadata = await require('sharp')(originalBuffer).metadata();

          // Compress image
          const compressed = await compressImage(originalBuffer, {
            maxWidth: 1920,
            quality: 80,
            format: 'jpeg',
          });

          // Upload original and compressed versions to project's bucket
          const uploadResult = await uploadBothVersions(
            originalBuffer,
            compressed.buffer,
            file.originalname,
            file.mimetype,
            s3BucketName,
            eventFolderName
          );

          // Create database record
          const imageId = `image_${nanoid()}`;
          const image = await Image.create({
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
            uploadStatus: 'completed',
            eventDeliveryStatusId,
            uploadedBy: userId,
            uploadedAt: new Date(),
          });

          console.log(`✓ Uploaded: ${file.originalname}`);

          return {
            success: true,
            imageId: image.imageId,
            fileName: file.originalname,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
          };
        } catch (error) {
          console.error(`✗ Failed: ${file.originalname}`, error);
          
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
            console.error(`Failed to save error record for ${file.originalname}:`, dbError);
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

    console.log(`Batch upload completed: ${successful.length} successful, ${failed.length} failed`);

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
    console.error('Batch upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload images', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const reorderImages = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId, imageIds } = req.body;
    const tenantId = req.user?.tenantId;

    if (!clientEventId || !imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ 
        message: 'Client Event ID and imageIds array are required' 
      });
    }

    if (!tenantId) {
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

    res.status(200).json({ 
      message: 'Images reordered successfully',
      imageIds 
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ 
      message: 'Failed to reorder images', 
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
  updateImage,
  bulkUpdateImages,
  deleteImage,
  bulkDeleteImages,
  uploadBatchImages,
  reorderImages
};
