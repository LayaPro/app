import { Response } from 'express';
import { nanoid } from 'nanoid';
import ClientEvent from '../models/clientEvent';
import Team from '../models/team';
import Project from '../models/project';
import { uploadToS3 } from '../utils/s3';
import { AuthRequest } from '../middleware/auth';

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

const trimDashes = (value: string) => value.replace(/--+/g, '-').replace(/^-|-$/g, '') || 'album';

const buildCustomerFolder = (projectName?: string, fallback?: string) =>
  `${trimDashes(sanitizeSegment(projectName || fallback || 'customer'))}-album`;

const sanitizePdfName = (fileName: string) => {
  const base = fileName.replace(/[^a-zA-Z0-9.-]+/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
  if (!base.toLowerCase().endsWith('.pdf')) {
    return `${base || 'album-proof'}.pdf`;
  }
  return base;
};

export const createClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      eventId,
      projectId,
      eventDeliveryStatusId,
      fromDatetime,
      toDatetime,
      venue,
      venueMapUrl,
      city,
      teamMembersAssigned,
      equipmentsAssigned,
      expenseId,
      coverPhoto,
      notes
    } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!eventId || !projectId) {
      return res.status(400).json({ message: 'Event ID and Project ID are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const clientEventId = `clientevent_${nanoid()}`;
    const clientEvent = await ClientEvent.create({
      clientEventId,
      tenantId,
      eventId,
      projectId,
      eventDeliveryStatusId,
      fromDatetime,
      toDatetime,
      venue,
      venueMapUrl,
      city,
      teamMembersAssigned,
      equipmentsAssigned,
      expenseId,
      coverPhoto,
      notes,
      createdBy: userId
    });

    return res.status(201).json({
      message: 'Client event created successfully',
      clientEvent
    });
  } catch (err: any) {
    console.error('Create client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllClientEvents = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'admin' || roleName === 'superadmin';

    let clientEvents;
    if (isAdmin) {
      // Admin sees all events in their tenant
      clientEvents = await ClientEvent.find({ tenantId }).sort({ createdAt: -1 }).lean();
    } else {
      // Find the user's team member ID
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember) {
        // User is not a team member
        return res.status(200).json({
          message: 'Client events retrieved successfully',
          count: 0,
          clientEvents: []
        });
      }

      // Non-admin users only see events where they are assigned as team members
      clientEvents = await ClientEvent.find({ 
        tenantId,
        teamMembersAssigned: teamMember.memberId 
      }).sort({ createdAt: -1 }).lean();
    }

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    console.error('Get all client events error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization: all users can only access their own tenant's events
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant client events.' });
    }

    // Non-admin users can only access events they're assigned to
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember || !clientEvent.teamMembersAssigned?.includes(teamMember.memberId)) {
        return res.status(403).json({ message: 'Access denied. You can only view events you are assigned to.' });
      }
    }

    return res.status(200).json({ clientEvent });
  } catch (err: any) {
    console.error('Get client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    // Don't allow updating clientEventId or tenantId
    delete updates.clientEventId;
    delete updates.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant client events.' });
    }

    // Check if user is admin or superadmin
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';

    // If not admin, only allow updating eventDeliveryStatusId
    if (!isAdmin) {
      const allowedFields = ['eventDeliveryStatusId'];
      const updateKeys = Object.keys(updates);
      const hasUnauthorizedFields = updateKeys.some(key => !allowedFields.includes(key));

      if (hasUnauthorizedFields) {
        return res.status(403).json({ 
          message: 'Access denied. You can only update the delivery status. Other fields require admin access.' 
        });
      }
    }

    // Add updatedBy field
    updates.updatedBy = userId;

    const updatedClientEvent = await ClientEvent.findOneAndUpdate(
      { clientEventId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Client event updated successfully',
      clientEvent: updatedClientEvent
    });
  } catch (err: any) {
    console.error('Update client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteClientEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.params;
    const tenantId = req.user?.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant client events.' });
    }

    await ClientEvent.deleteOne({ clientEventId });

    return res.status(200).json({
      message: 'Client event deleted successfully',
      clientEventId
    });
  } catch (err: any) {
    console.error('Delete client event error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventsByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'admin' || roleName === 'superadmin';

    let clientEvents;
    if (isAdmin) {
      // Admin sees all events for the project
      clientEvents = await ClientEvent.find({ projectId, tenantId }).sort({ fromDatetime: 1 }).lean();
    } else {
      // Find the user's team member ID
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (!teamMember) {
        // User is not a team member
        return res.status(200).json({
          message: 'Client events retrieved successfully',
          count: 0,
          clientEvents: []
        });
      }

      // Non-admin users only see events where they are assigned as team members
      clientEvents = await ClientEvent.find({ 
        projectId, 
        tenantId,
        teamMembersAssigned: teamMember.memberId 
      }).sort({ fromDatetime: 1 }).lean();
    }

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    console.error('Get client events by project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadAlbumPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, clientEventId } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId || !clientEventId) {
      return res.status(400).json({ message: 'Project ID and Client Event ID are required' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Album PDF file is required' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed for album uploads' });
    }

    const clientEvent = await ClientEvent.findOne({ clientEventId, tenantId });
    if (!clientEvent) {
      return res.status(404).json({ message: 'Client event not found' });
    }

    if (clientEvent.projectId !== projectId) {
      return res.status(400).json({ message: 'Client event does not belong to the specified project' });
    }

    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const bucketName = project.s3BucketName || process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      return res.status(400).json({ message: 'No S3 bucket configured for this customer' });
    }

    const folder = buildCustomerFolder(project.projectName, project.projectId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFileName = sanitizePdfName(file.originalname || 'album-proof.pdf');
    const finalFileName = `${timestamp}-${safeFileName}`;

    const pdfUrl = await uploadToS3({
      buffer: file.buffer,
      fileName: finalFileName,
      mimeType: file.mimetype,
      folder,
      bucketName,
      storageClass: 'STANDARD',
    });

    clientEvent.albumPdfUrl = pdfUrl;
    clientEvent.albumPdfFileName = file.originalname || safeFileName;
    clientEvent.albumPdfUploadedAt = new Date();
    clientEvent.albumPdfUploadedBy = userId;
    await clientEvent.save();

    return res.status(200).json({
      message: 'Album PDF uploaded successfully',
      clientEvent,
    });
  } catch (err) {
    console.error('Upload album PDF error:', err);
    return res.status(500).json({ message: 'Failed to upload album PDF' });
  }
};

export default {
  createClientEvent,
  getAllClientEvents,
  getClientEventById,
  updateClientEvent,
  deleteClientEvent,
  getClientEventsByProject,
  uploadAlbumPdf
};
