import { Response } from 'express';
import { nanoid } from 'nanoid';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Team from '../models/team';
import Project from '../models/project';
import AlbumPdf from '../models/albumPdf';
import { uploadToS3, deleteFromS3 } from '../utils/s3';
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

    if (!fromDatetime || !toDatetime) {
      return res.status(400).json({ message: 'From datetime and To datetime are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // If no status provided, default to SCHEDULED
    let finalStatusId = eventDeliveryStatusId;
    if (!finalStatusId) {
      const scheduledStatus = await EventDeliveryStatus.findOne({
        tenantId,
        statusCode: 'SCHEDULED'
      });
      finalStatusId = scheduledStatus?.statusId;
    }

    const clientEventId = `clientevent_${nanoid()}`;
    const clientEvent = await ClientEvent.create({
      clientEventId,
      tenantId,
      eventId,
      projectId,
      eventDeliveryStatusId: finalStatusId,
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

    const isAdmin = roleName === 'Admin';

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
    const isAdmin = roleName === 'Admin';
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

    // Check if user is admin
    const isAdmin = roleName === 'Admin';

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

    // Automatically update status when editor or designer is assigned
    const currentEvent = await ClientEvent.findOne({ clientEventId });
    
    // If albumEditor is being assigned (and not being removed), set status to EDITING_ONGOING
    if (updates.albumEditor && updates.albumEditor !== currentEvent?.albumEditor) {
      const editingStatus = await EventDeliveryStatus.findOne({
        tenantId,
        statusCode: 'EDITING_ONGOING'
      });
      if (editingStatus) {
        updates.eventDeliveryStatusId = editingStatus.statusId;
      }
    }
    
    // If albumDesigner is being assigned (and not being removed), set status to ALBUM_DESIGN_ONGOING
    if (updates.albumDesigner && updates.albumDesigner !== currentEvent?.albumDesigner) {
      const designStatus = await EventDeliveryStatus.findOne({
        tenantId,
        statusCode: 'ALBUM_DESIGN_ONGOING'
      });
      if (designStatus) {
        updates.eventDeliveryStatusId = designStatus.statusId;
      }
    }

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

    const isAdmin = roleName === 'Admin';

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
    const { projectId, clientEventId, clientEventIds } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    let targetEventIds: string[] = [];

    if (clientEventIds) {
      if (Array.isArray(clientEventIds)) {
        targetEventIds = clientEventIds;
      } else if (typeof clientEventIds === 'string') {
        try {
          const parsed = JSON.parse(clientEventIds);
          if (Array.isArray(parsed)) {
            targetEventIds = parsed;
          }
        } catch (err) {
          targetEventIds = clientEventIds.split(',');
        }
      }
    }

    if (!targetEventIds.length && clientEventId) {
      targetEventIds = [clientEventId];
    }

    targetEventIds = Array.from(new Set(targetEventIds.filter((id) => typeof id === 'string' && id.trim() !== '')));

    if (targetEventIds.length === 0) {
      return res.status(400).json({ message: 'At least one client event ID is required' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Album PDF file is required' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed for album uploads' });
    }

    const clientEvents = await ClientEvent.find({ tenantId, clientEventId: { $in: targetEventIds } });
    if (clientEvents.length !== targetEventIds.length) {
      const foundIds = clientEvents.map((evt) => evt.clientEventId);
      const missing = targetEventIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({ message: `Client events not found: ${missing.join(', ')}` });
    }

    const hasMismatchedProject = clientEvents.some((evt) => evt.projectId !== projectId);
    if (hasMismatchedProject) {
      return res.status(400).json({ message: 'One or more client events do not belong to the specified project' });
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

    const isMultipleEvents = targetEventIds.length > 1;

    // Find ALL existing PDFs for this project and delete them
    const existingPdfs = await AlbumPdf.find({
      tenantId,
      projectId
    });

    // Delete all existing PDFs from database and S3
    let deletedCount = 0;
    for (const existingPdf of existingPdfs) {
      try {
        await deleteFromS3(existingPdf.albumPdfUrl);
        await AlbumPdf.deleteOne({ _id: existingPdf._id });
        deletedCount++;
      } catch (deleteError) {
        console.error('Failed to delete existing PDF:', deleteError);
        // Continue - we'll still create the new PDF
      }
    }

    // Create new AlbumPdf record
    const albumPdf = await AlbumPdf.create({
      albumId: nanoid(10),
      tenantId,
      projectId,
      eventIds: targetEventIds,
      isMultipleEvents,
      albumStatus: 'uploaded',
      albumPdfUrl: pdfUrl,
      albumPdfFileName: file.originalname || safeFileName,
      uploadedDate: new Date(),
      uploadedBy: userId,
    });

    // Update all target events to ALBUM_DESIGN_COMPLETE status
    const albumDesignCompleteStatus = await EventDeliveryStatus.findOne({
      tenantId,
      statusCode: 'ALBUM_DESIGN_COMPLETE'
    });

    if (albumDesignCompleteStatus) {
      await ClientEvent.updateMany(
        { clientEventId: { $in: targetEventIds }, tenantId },
        {
          $set: {
            eventDeliveryStatusId: albumDesignCompleteStatus.statusId,
            updatedBy: userId
          }
        }
      );
    }

    return res.status(200).json({
      message: deletedCount > 0 ? `Replaced ${deletedCount} existing PDF${deletedCount > 1 ? 's' : ''}` : 'Album PDF uploaded successfully',
      albumPdf: albumPdf.toObject(),
      deletedCount
    });
  } catch (err) {
    console.error('Upload album PDF error:', err);
    return res.status(500).json({ message: 'Failed to upload album PDF' });
  }
};

export const uploadAlbumPdfBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, mappings } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const files = req.files as Express.Multer.File[];

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one PDF file is required' });
    }

    if (!mappings) {
      return res.status(400).json({ message: 'Mappings are required' });
    }

    let parsedMappings;
    try {
      parsedMappings = JSON.parse(mappings);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid mappings format' });
    }

    if (!Array.isArray(parsedMappings) || parsedMappings.length === 0) {
      return res.status(400).json({ message: 'Mappings must be a non-empty array' });
    }

    if (files.length !== parsedMappings.length) {
      return res.status(400).json({ message: 'Number of files must match number of mappings' });
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: `File ${file.originalname} is not a PDF` });
      }
    }

    // Validate all events exist
    const allEventIds = parsedMappings.flatMap((m: any) => m.eventIds || []);
    const uniqueEventIds = Array.from(new Set(allEventIds));
    
    const clientEvents = await ClientEvent.find({ 
      tenantId, 
      clientEventId: { $in: uniqueEventIds } 
    });

    if (clientEvents.length !== uniqueEventIds.length) {
      const foundIds = clientEvents.map((evt) => evt.clientEventId);
      const missing = uniqueEventIds.filter((id: string) => !foundIds.includes(id));
      return res.status(404).json({ message: `Client events not found: ${missing.join(', ')}` });
    }

    const hasMismatchedProject = clientEvents.some((evt) => evt.projectId !== projectId);
    if (hasMismatchedProject) {
      return res.status(400).json({ message: 'One or more client events do not belong to the specified project' });
    }

    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const bucketName = project.s3BucketName || process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      return res.status(400).json({ message: 'No S3 bucket configured for this customer' });
    }

    // Delete ALL existing PDFs for this project
    const existingPdfs = await AlbumPdf.find({ tenantId, projectId });
    let deletedCount = 0;
    for (const existingPdf of existingPdfs) {
      try {
        await deleteFromS3(existingPdf.albumPdfUrl);
        await AlbumPdf.deleteOne({ _id: existingPdf._id });
        deletedCount++;
      } catch (deleteError) {
        console.error('Failed to delete existing PDF:', deleteError);
      }
    }

    // Upload all new PDFs
    const folder = buildCustomerFolder(project.projectName, project.projectId);
    const createdPdfs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mapping = parsedMappings[i];
      const eventIds = mapping.eventIds || [];

      if (eventIds.length === 0) {
        continue;
      }

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

      const albumPdf = await AlbumPdf.create({
        albumId: nanoid(10),
        tenantId,
        projectId,
        eventIds: eventIds,
        isMultipleEvents: eventIds.length > 1,
        albumStatus: 'uploaded',
        albumPdfUrl: pdfUrl,
        albumPdfFileName: file.originalname || safeFileName,
        uploadedDate: new Date(),
        uploadedBy: userId,
      });

      createdPdfs.push(albumPdf.toObject());
    }

    // Update all target events to ALBUM_DESIGN_COMPLETE status
    const batchAllEventIds = Array.from(new Set(parsedMappings.flatMap(m => m.eventIds || [])));
    if (batchAllEventIds.length > 0) {
      const albumDesignCompleteStatus = await EventDeliveryStatus.findOne({
        tenantId,
        statusCode: 'ALBUM_DESIGN_COMPLETE'
      });

      if (albumDesignCompleteStatus) {
        await ClientEvent.updateMany(
          { clientEventId: { $in: batchAllEventIds }, tenantId },
          {
            $set: {
              eventDeliveryStatusId: albumDesignCompleteStatus.statusId,
              updatedBy: userId
            }
          }
        );
      }
    }

    return res.status(200).json({
      message: `Successfully uploaded ${createdPdfs.length} PDF${createdPdfs.length > 1 ? 's' : ''}`,
      albumPdfs: createdPdfs,
      deletedCount,
    });
  } catch (err) {
    console.error('Batch upload album PDF error:', err);
    return res.status(500).json({ message: 'Failed to upload album PDFs' });
  }
};

export const approveAlbumDesign = async (req: AuthRequest, res: Response) => {
  try {
    const { clientEventId } = req.body;
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!clientEventId) {
      return res.status(400).json({ error: 'Client Event ID is required' });
    }

    // Find ALBUM_PRINTING status
    const albumPrintingStatus = await EventDeliveryStatus.findOne({
      tenantId,
      statusCode: 'ALBUM_PRINTING'
    });

    if (!albumPrintingStatus) {
      return res.status(404).json({ error: 'Album Printing status not found' });
    }

    // Update the event status
    const updatedEvent = await ClientEvent.findOneAndUpdate(
      { clientEventId, tenantId },
      {
        $set: { 
          eventDeliveryStatusId: albumPrintingStatus.statusId,
          updatedBy: userId
        }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Client Event not found' });
    }

    res.status(200).json({ 
      message: 'Album design approved successfully, printing in progress',
      clientEvent: updatedEvent
    });
  } catch (error) {
    console.error('Error approving album design:', error);
    res.status(500).json({ error: 'Failed to approve album design' });
  }
};

export default {
  createClientEvent,
  getAllClientEvents,
  getClientEventById,
  updateClientEvent,
  deleteClientEvent,
  getClientEventsByProject,
  uploadAlbumPdf,
  uploadAlbumPdfBatch,
  approveAlbumDesign
};

