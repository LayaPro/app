import { Response } from 'express';
import { nanoid } from 'nanoid';
import AlbumPdf from '../models/albumPdf';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import { AuthRequest } from '../middleware/auth';
import { deleteFromS3 } from '../utils/s3';

export const createAlbumPdf = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId,
      eventIds,
      albumPdfUrl,
      albumPdfFileName,
      albumStatus = 'uploaded'
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!projectId || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ 
        message: 'Project ID and Event IDs array are required' 
      });
    }

    if (!albumPdfUrl || !albumPdfFileName) {
      return res.status(400).json({ 
        message: 'Album PDF URL and file name are required' 
      });
    }

    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }

    // Verify project exists and belongs to tenant
    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify all events exist and belong to the project
    const events = await ClientEvent.find({ 
      clientEventId: { $in: eventIds },
      projectId,
      tenantId 
    });

    if (events.length !== eventIds.length) {
      return res.status(400).json({ 
        message: 'One or more event IDs are invalid or do not belong to this project' 
      });
    }

    const albumId = `album_${nanoid()}`;
    const isMultipleEvents = eventIds.length > 1;
    
    const albumPdf = await AlbumPdf.create({
      albumId,
      tenantId,
      projectId,
      albumStatus,
      eventIds,
      isMultipleEvents,
      albumPdfUrl,
      albumPdfFileName,
      uploadedDate: new Date(),
      uploadedBy: userId
    });

    return res.status(201).json({
      message: 'Album PDF created successfully',
      albumPdf
    });
  } catch (err: any) {
    console.error('Create album PDF error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAlbumPdfs = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdfs = await AlbumPdf.find({ tenantId }).sort({ uploadedDate: -1 }).lean();

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    console.error('Get all album PDFs error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfsByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdfs = await AlbumPdf.find({ projectId, tenantId }).sort({ uploadedDate: -1 }).lean();

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    console.error('Get album PDFs by project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfById = async (req: AuthRequest, res: Response) => {
  try {
    const { albumId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdf = await AlbumPdf.findOne({ albumId, tenantId }).lean();

    if (!albumPdf) {
      return res.status(404).json({ message: 'Album PDF not found' });
    }

    return res.status(200).json({
      message: 'Album PDF retrieved successfully',
      albumPdf
    });
  } catch (err: any) {
    console.error('Get album PDF by ID error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAlbumPdfStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { albumId } = req.params;
    const { albumStatus } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!albumStatus || !['uploaded', 'approved'].includes(albumStatus)) {
      return res.status(400).json({ 
        message: 'Valid album status is required (uploaded or approved)' 
      });
    }

    const albumPdf = await AlbumPdf.findOneAndUpdate(
      { albumId, tenantId },
      { albumStatus },
      { new: true }
    );

    if (!albumPdf) {
      return res.status(404).json({ message: 'Album PDF not found' });
    }

    return res.status(200).json({
      message: 'Album PDF status updated successfully',
      albumPdf
    });
  } catch (err: any) {
    console.error('Update album PDF status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAlbumPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { albumId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdf = await AlbumPdf.findOne({ albumId, tenantId });

    if (!albumPdf) {
      return res.status(404).json({ message: 'Album PDF not found' });
    }

    // Store the URL before deletion
    const pdfUrl = albumPdf.albumPdfUrl;

    // Delete from database
    await AlbumPdf.deleteOne({ albumId, tenantId });

    // Delete the PDF file from S3
    if (pdfUrl) {
      try {
        await deleteFromS3(pdfUrl);
      } catch (s3Error) {
        console.error('Failed to delete PDF from S3:', s3Error);
        // Continue even if S3 deletion fails - the DB record is already deleted
      }
    }

    return res.status(200).json({
      message: 'Album PDF deleted successfully',
      albumPdf: albumPdf.toObject()
    });
  } catch (err: any) {
    console.error('Delete album PDF error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfsByEventId = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Find all album PDFs that include this event ID
    const albumPdfs = await AlbumPdf.find({ 
      eventIds: clientEventId,
      tenantId 
    }).sort({ uploadedDate: -1 }).lean();

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    console.error('Get album PDFs by event ID error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkExistingAlbumPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: 'Project ID is required' 
      });
    }

    // Find ALL existing PDFs for this project
    const existingPdfs = await AlbumPdf.find({
      tenantId,
      projectId
    }).lean();

    return res.status(200).json({
      exists: existingPdfs.length > 0,
      count: existingPdfs.length,
      albumPdfs: existingPdfs
    });
  } catch (err: any) {
    console.error('Check existing album PDF error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createAlbumPdf,
  getAllAlbumPdfs,
  getAlbumPdfsByProject,
  getAlbumPdfById,
  updateAlbumPdfStatus,
  deleteAlbumPdf,
  getAlbumPdfsByEventId,
  checkExistingAlbumPdf
};
