import { Response } from 'express';
import { nanoid } from 'nanoid';
import Image from '../models/image';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Event from '../models/event';
import User from '../models/user';
import Role from '../models/role';
import ImageStatus from '../models/imageStatus';
import Team from '../models/team';
import { AuthRequest } from '../middleware/auth';
import { compressImage } from '../utils/imageProcessor';
import { uploadToS3, uploadBothVersions, bulkDeleteFromS3 } from '../utils/s3';
import pMap from 'p-map';
import exifr from 'exifr';

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
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;
    const { selectedByClient, markedAsFavorite } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if user has access to this event
    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Non-admin users can only access events they're assigned to
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember || !clientEvent.teamMembersAssigned?.includes(teamMember.memberId)) {
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
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'admin' || roleName === 'superadmin';

    // For non-admin users, check if they have access to any events in this project
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember) {
        return res.status(403).json({ message: 'Access denied. You are not a team member.' });
      }

      const assignedEvents = await ClientEvent.find({ 
        projectId, 
        tenantId,
        teamMembersAssigned: teamMember.memberId 
      }).lean();

      if (assignedEvents.length === 0) {
        return res.status(403).json({ message: 'Access denied. You have no assigned events in this project.' });
      }

      // Get images only from assigned events
      const assignedEventIds = assignedEvents.map(e => e.clientEventId);
      const images = await Image.find({ 
        projectId, 
        tenantId,
        clientEventId: { $in: assignedEventIds }
      }).sort({ uploadedAt: -1 }).lean();

      return res.status(200).json({
        message: 'Images retrieved successfully',
        count: images.length,
        images
      });
    }

    // Admin sees all images in the project
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

export const getImageProperties = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const tenantId = req.user?.tenantId;

    const image = await Image.findOne({ imageId }).lean();

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check authorization
    if (image.tenantId !== tenantId) {
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

    return res.status(200).json({ image: properties });
  } catch (err: any) {
    console.error('Get image properties error:', err);
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

    // Fetch images to get S3 URLs before deleting
    const images = await Image.find({
      imageId: { $in: imageIds },
      tenantId
    }).lean();

    if (images.length === 0) {
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
    }

    // Delete from database
    const result = await Image.deleteMany({
      imageId: { $in: imageIds },
      tenantId
    });

    return res.status(200).json({
      message: 'Images deleted successfully',
      deletedCount: result.deletedCount,
      s3FilesDeleted: s3Urls.length
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

    // Determine image status based on user role
    const user = await User.findOne({ userId, tenantId });
    let imageStatusId: string | undefined;
    
    if (user) {
      const role = await Role.findOne({ roleId: user.roleId });
      if (role) {
        // All uploads go to REVIEW_PENDING status
        const statusCode = 'REVIEW_PENDING';
        const imageStatus = await ImageStatus.findOne({ statusCode, tenantId });
        if (imageStatus) {
          imageStatusId = imageStatus.statusId;
        }
      }
    }

    console.log(`Starting batch upload of ${files.length} images to bucket: ${s3BucketName}, folder: ${eventFolderName}...`);

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
              
              console.log(`EXIF dates for ${file.originalname}:`, {
                DateTimeOriginal: exifData.DateTimeOriginal,
                CreateDate: exifData.CreateDate,
                DateTime: exifData.DateTime,
                ModifyDate: exifData.ModifyDate,
                capturedAt,
                editedAt
              });
            }
          } catch (exifError) {
            console.log(`Could not parse EXIF dates for ${file.originalname}:`, exifError);
          }

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
            capturedAt: capturedAt,
            editedAt: editedAt,
            uploadStatus: 'completed',
            eventDeliveryStatusId,
            imageStatusId,
            sortOrder: currentSortOrder,
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

// Reupload edited images - updates existing records
export const reuploadImages = async (req: AuthRequest, res: Response) => {
  try {
    // Parse imageIds from FormData (sent as JSON string)
    let imageIds: string[] = [];
    if (req.body.imageIds) {
      try {
        imageIds = typeof req.body.imageIds === 'string' 
          ? JSON.parse(req.body.imageIds) 
          : req.body.imageIds;
      } catch (e) {
        return res.status(400).json({ 
          message: 'Invalid image selection data' 
        });
      }
    }

    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ 
        message: 'Please select images to re-upload' 
      });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Unable to verify your account. Please log in again.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
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

    const s3BucketName = project.s3BucketName;
    if (!s3BucketName) {
      return res.status(400).json({ message: 'Project does not have an S3 bucket configured' });
    }

    // Get event info for folder name
    const clientEvent = await ClientEvent.findOne({ clientEventId: firstImage.clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    const event = await Event.findOne({ eventId: clientEvent.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventFolderName = event.eventDesc
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    // Get "Re-edit done" status
    const reEditDoneStatus = await ImageStatus.findOne({ 
      statusCode: 'CHANGES_DONE',
      tenantId 
    });

    console.log(`Processing ${files.length} files for reupload...`);

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
            console.log(`⚠ No matching image found for: ${file.originalname}`);
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
            console.log(`Could not parse EXIF dates for ${file.originalname}`);
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
            eventFolderName
          );

          // Update existing image record
          await Image.findOneAndUpdate(
            { imageId: existingImage.imageId, tenantId },
            {
              originalUrl: uploadResult.originalUrl,
              compressedUrl: uploadResult.compressedUrl,
              fileSize: file.size,
              width: originalMetadata.width,
              height: originalMetadata.height,
              capturedAt: capturedAt || existingImage.capturedAt,
              editedAt: editedAt || new Date(),
              uploadStatus: 'completed',
              imageStatusId: reEditDoneStatus?.statusId || existingImage.imageStatusId,
              uploadedBy: userId,
              uploadedAt: new Date(),
            }
          );

          console.log(`✓ Re-uploaded: ${file.originalname}`);

          return {
            success: true,
            imageId: existingImage.imageId,
            fileName: file.originalname,
            originalUrl: uploadResult.originalUrl,
            compressedUrl: uploadResult.compressedUrl,
          };
        } catch (error) {
          console.error(`✗ Failed to reupload: ${file.originalname}`, error);
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

    return res.status(200).json({
      message: 'Reupload completed',
      successful: successful.length,
      failed: failed.length,
      results,
    });
  } catch (err: any) {
    console.error('Reupload images error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve images endpoint
export const approveImages = async (req: AuthRequest, res: Response) => {
  try {
    const { imageIds } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: 'Please select images to approve' });
    }

    // Find the REVIEWED status (which represents approved images)
    const approvedStatus = await ImageStatus.findOne({ 
      statusCode: 'REVIEWED', 
      tenantId 
    });

    if (!approvedStatus) {
      return res.status(404).json({ message: 'Approved status not found in the system' });
    }

    // Verify all images belong to this tenant
    const images = await Image.find({
      imageId: { $in: imageIds },
      tenantId
    });

    if (images.length !== imageIds.length) {
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

    return res.status(200).json({
      message: 'Images approved successfully',
      approvedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('Approve images error:', err);
    return res.status(500).json({ 
      message: 'An error occurred while approving images. Please try again.' 
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
  approveImages
};
