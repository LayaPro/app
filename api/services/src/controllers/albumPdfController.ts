import { Response } from 'express';
import { nanoid } from 'nanoid';
import AlbumPdf from '../models/albumPdf';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import { AuthRequest } from '../middleware/auth';
import { deleteFromS3 } from '../utils/s3';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('AlbumPdfController');

export const createAlbumPdf = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    projectId,
    eventIds,
    albumPdfUrl,
    albumPdfFileName,
    albumStatus = 'uploaded'
  } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating album PDF`, { tenantId, projectId, eventsCount: eventIds?.length });

  try {
    if (!projectId || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId, projectId });
      return res.status(400).json({ 
        message: 'Project ID and Event IDs array are required' 
      });
    }

    if (!albumPdfUrl || !albumPdfFileName) {
      logger.warn(`[${requestId}] Missing PDF URL or filename`, { tenantId, projectId });
      return res.status(400).json({ 
        message: 'Album PDF URL and file name are required' 
      });
    }

    if (!tenantId || !userId) {
      logger.warn(`[${requestId}] Tenant ID or User ID missing`);
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }

    // Verify project exists and belongs to tenant
    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify all events exist and belong to the project
    const events = await ClientEvent.find({ 
      clientEventId: { $in: eventIds },
      projectId,
      tenantId 
    });

    if (events.length !== eventIds.length) {
      logger.warn(`[${requestId}] Invalid event IDs`, { tenantId, projectId, expected: eventIds.length, found: events.length });
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

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'AlbumPdf',
      entityId: albumId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { projectId, eventsCount: eventIds.length, fileName: albumPdfFileName },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Album PDF created`, { tenantId, albumId, projectId, eventsCount: eventIds.length });

    return res.status(201).json({
      message: 'Album PDF created successfully',
      albumPdf
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating album PDF`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAlbumPdfs = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all album PDFs`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdfs = await AlbumPdf.find({ tenantId }).sort({ uploadedDate: -1 }).lean();

    logger.info(`[${requestId}] Album PDFs retrieved`, { tenantId, count: albumPdfs.length });

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching album PDFs`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfsByProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching album PDFs by project`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdfs = await AlbumPdf.find({ projectId, tenantId }).sort({ uploadedDate: -1 }).lean();

    logger.info(`[${requestId}] Album PDFs by project retrieved`, { tenantId, projectId, count: albumPdfs.length });

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching album PDFs by project`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { albumId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching album PDF by ID`, { tenantId, albumId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdf = await AlbumPdf.findOne({ albumId, tenantId }).lean();

    if (!albumPdf) {
      logger.warn(`[${requestId}] Album PDF not found`, { tenantId, albumId });
      return res.status(404).json({ message: 'Album PDF not found' });
    }

    logger.info(`[${requestId}] Album PDF retrieved`, { tenantId, albumId });

    return res.status(200).json({
      message: 'Album PDF retrieved successfully',
      albumPdf
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching album PDF`, { 
      tenantId,
      albumId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAlbumPdfStatus = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { albumId } = req.params;
  const { albumStatus } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating album PDF status`, { tenantId, albumId, albumStatus });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!albumStatus || !['uploaded', 'approved'].includes(albumStatus)) {
      logger.warn(`[${requestId}] Invalid album status`, { tenantId, albumId, albumStatus });
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
      logger.warn(`[${requestId}] Album PDF not found for update`, { tenantId, albumId });
      return res.status(404).json({ message: 'Album PDF not found' });
    }

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'AlbumPdf',
      entityId: albumId,
      tenantId,
      performedBy: userId || 'System',
      changes: { albumStatus },
      metadata: { projectId: albumPdf.projectId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Album PDF status updated`, { tenantId, albumId, albumStatus });

    return res.status(200).json({
      message: 'Album PDF status updated successfully',
      albumPdf
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating album PDF status`, { 
      tenantId,
      albumId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAlbumPdf = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { albumId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting album PDF`, { tenantId, albumId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const albumPdf = await AlbumPdf.findOne({ albumId, tenantId });

    if (!albumPdf) {
      logger.warn(`[${requestId}] Album PDF not found for deletion`, { tenantId, albumId });
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
        logger.info(`[${requestId}] PDF deleted from S3`, { tenantId, albumId });
      } catch (s3Error: any) {
        logger.error(`[${requestId}] Failed to delete PDF from S3`, { 
          tenantId,
          albumId,
          pdfUrl,
          error: s3Error.message 
        });
        // Continue even if S3 deletion fails - the DB record is already deleted
      }
    }

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'AlbumPdf',
      entityId: albumId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { deleted: true, projectId: albumPdf.projectId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Album PDF deleted`, { tenantId, albumId });

    return res.status(200).json({
      message: 'Album PDF deleted successfully',
      albumPdf: albumPdf.toObject()
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting album PDF`, { 
      tenantId,
      albumId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAlbumPdfsByEventId = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching album PDFs by event ID`, { tenantId, clientEventId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Find all album PDFs that include this event ID
    const albumPdfs = await AlbumPdf.find({ 
      eventIds: clientEventId,
      tenantId 
    }).sort({ uploadedDate: -1 }).lean();

    logger.info(`[${requestId}] Album PDFs by event ID retrieved`, { 
      tenantId,
      clientEventId,
      count: albumPdfs.length 
    });

    return res.status(200).json({
      message: 'Album PDFs retrieved successfully',
      count: albumPdfs.length,
      albumPdfs
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching album PDFs by event ID`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkExistingAlbumPdf = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.body;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Checking existing album PDF`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      logger.warn(`[${requestId}] Project ID missing`, { tenantId });
      return res.status(400).json({ 
        message: 'Project ID is required' 
      });
    }

    // Find ALL existing PDFs for this project
    const existingPdfs = await AlbumPdf.find({
      tenantId,
      projectId
    }).lean();

    logger.info(`[${requestId}] Album PDF check complete`, { 
      tenantId,
      projectId,
      exists: existingPdfs.length > 0,
      count: existingPdfs.length 
    });

    return res.status(200).json({
      exists: existingPdfs.length > 0,
      count: existingPdfs.length,
      albumPdfs: existingPdfs
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error checking existing album PDF`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
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
