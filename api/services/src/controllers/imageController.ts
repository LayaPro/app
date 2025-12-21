import { Response } from 'express';
import { nanoid } from 'nanoid';
import Image from '../models/image';
import { AuthRequest } from '../middleware/auth';

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
  bulkDeleteImages
};
