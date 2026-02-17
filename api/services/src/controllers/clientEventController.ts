import { Response } from 'express';
import { nanoid } from 'nanoid';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import ProjectDeliveryStatus from '../models/projectDeliveryStatus';
import Team from '../models/team';
import User from '../models/user';
import Project from '../models/project';
import Event from '../models/event';
import AlbumPdf from '../models/albumPdf';
import Todo from '../models/todo';
import { uploadToS3, deleteFromS3 } from '../utils/s3';
import { getMainBucketName } from '../utils/s3Bucket';
import { AuthRequest } from '../middleware/auth';
import { NotificationUtils } from '../services/notificationUtils';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('ClientEventController');

/**
 * Create todo for editor when assigned to an event
 */
async function createEditorAssignmentTodo(
  tenantId: string,
  userId: string,
  eventName: string,
  projectName: string,
  projectId: string,
  clientEventId: string,
  editingDueDate: Date | undefined,
  eventEndDate: Date,
  requestId: string
): Promise<void> {
  try {
    const dueDate = editingDueDate || eventEndDate;
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) : '';
    
    const description = dueDateStr 
      ? `Complete editing for ${eventName} in ${projectName} - Due ${dueDateStr}`
      : `Complete editing for ${eventName} in ${projectName}`;

    await Todo.create({
      todoId: `todo_${nanoid()}`,
      tenantId,
      userId,
      description,
      projectId,
      eventId: clientEventId,
      priority: 'high',
      dueDate: dueDate,
      redirectUrl: `/projects/${projectId}`,
      addedBy: 'system',
      isDone: false
    });

    logger.info(`[${requestId}] Created editing todo for editor`, {
      tenantId,
      userId,
      clientEventId
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to create editing todo for editor`, {
      tenantId,
      userId,
      error: error.message
    });
  }
}

/**
 * Create todo for designer when assigned to an event
 */
async function createDesignerAssignmentTodo(
  tenantId: string,
  userId: string,
  eventName: string,
  projectName: string,
  projectId: string,
  clientEventId: string,
  albumDesignDueDate: Date | undefined,
  eventEndDate: Date,
  requestId: string
): Promise<void> {
  try {
    const dueDate = albumDesignDueDate || eventEndDate;
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) : '';
    
    const description = dueDateStr 
      ? `Complete album design for ${eventName} in ${projectName} - Due ${dueDateStr}`
      : `Complete album design for ${eventName} in ${projectName}`;

    await Todo.create({
      todoId: `todo_${nanoid()}`,
      tenantId,
      userId,
      description,
      projectId,
      eventId: clientEventId,
      priority: 'high',
      dueDate: dueDate,
      redirectUrl: `/projects/${projectId}`,
      addedBy: 'system',
      isDone: false
    });

    logger.info(`[${requestId}] Created design todo for designer`, {
      tenantId,
      userId,
      clientEventId
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to create design todo for designer`, {
      tenantId,
      userId,
      error: error.message
    });
  }
}

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

/**
 * Check if all events in a project are in DELIVERY status
 * If yes, update project status to Completed
 */
const checkAndUpdateProjectStatus = async (projectId: string, tenantId: string) => {
  try {
    logger.info('Checking project status for completion', { projectId, tenantId });
    
    // Get all events for this project
    const allEvents = await ClientEvent.find({ projectId, tenantId });
    
    logger.info('Found events for project', { projectId, tenantId, count: allEvents.length });
    
    if (allEvents.length === 0) {
      return; // No events, nothing to check
    }

    // Get DELIVERY status
    const deliveryStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'DELIVERY'
    });

    if (!deliveryStatus) {
      logger.warn('DELIVERY status not found', { tenantId });
      return;
    }

    logger.info('DELIVERY status found', { tenantId, statusId: deliveryStatus.statusId });

    // Check if ALL events are in DELIVERY status
    const allEventsDelivered = allEvents.every(
      event => event.eventDeliveryStatusId === deliveryStatus.statusId
    );

    logger.info('All events delivery check result', { projectId, tenantId, allEventsDelivered });

    if (allEventsDelivered) {
      logger.info('All events delivered, updating project status to Completed', { projectId, tenantId });
      
      // Update project status to Completed (hardcoded status)
      const result = await Project.findOneAndUpdate(
        { projectId, tenantId },
        { $set: { status: 'Completed' } },
        { new: true }
      );
      
      logger.info('Project status updated to Completed', { 
        projectId, 
        tenantId,
        newStatus: result?.status
      });
    } else {
      logger.info('Not all events are delivered yet', { projectId, tenantId });
    }
  } catch (error: any) {
    logger.error('Error checking project status', { 
      projectId,
      tenantId,
      error: error.message,
      stack: error.stack 
    });
  }
};

export const createClientEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
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

  logger.info(`[${requestId}] Creating client event`, { tenantId, eventId, projectId });

  try {
    if (!eventId || !projectId) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Event ID and Project ID are required' });
    }

    if (!fromDatetime || !toDatetime) {
      logger.warn(`[${requestId}] Missing datetime fields`, { tenantId });
      return res.status(400).json({ message: 'From datetime and To datetime are required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // If no status provided, default to SCHEDULED
    let finalStatusId = eventDeliveryStatusId;
    if (!finalStatusId) {
      const scheduledStatus = await EventDeliveryStatus.findOne({
        tenantId: { $in: [tenantId, -1] },
        statusCode: 'SCHEDULED'
      });
      finalStatusId = scheduledStatus?.statusId;
    }

    const clientEventId = `clientevent_${nanoid()}`;
    
    // Fetch event master data to get event name
    const event = await Event.findOne({ 
      eventId,
      tenantId: { $in: [tenantId, -1] }
    });
    if (!event) {
      logger.warn(`[${requestId}] Event not found`, { tenantId, eventId });
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Generate S3 folder name from event description
    const s3EventFolderName = event.eventDesc.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
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
      s3EventFolderName,
      createdBy: userId
    });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ClientEvent',
      entityId: clientEventId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { eventId, projectId, venue },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Client event created`, { tenantId, clientEventId, eventId, projectId });

    return res.status(201).json({
      message: 'Client event created successfully',
      clientEvent
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating client event`, { 
      tenantId,
      eventId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllClientEvents = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching all client events`, { tenantId, roleName });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
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
      
      // Non-admin users see events where they are:
      // 1. Assigned as team members, OR
      // 2. Assigned as album editor (by userId or memberId), OR
      // 3. Assigned as album designer (by userId or memberId)
      const query: any = {
        tenantId,
        $or: [
          { albumEditor: userId },
          { albumDesigner: userId }
        ]
      };
      
      // Add conditions for memberId if user is a team member
      if (teamMember) {
        const memberId = teamMember.memberId;
        query.$or.push({ teamMembersAssigned: memberId });
        query.$or.push({ albumEditor: memberId });
        query.$or.push({ albumDesigner: memberId });
      }
      
      clientEvents = await ClientEvent.find(query).sort({ createdAt: -1 }).lean();
    }

    logger.info(`[${requestId}] Client events retrieved`, { 
      tenantId,
      count: clientEvents.length,
      isAdmin 
    });

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching client events`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching client event by ID`, { tenantId, clientEventId });

  try {
    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization: all users can only access their own tenant's events
    if (clientEvent.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied - tenant mismatch`, { tenantId, clientEventId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant client events.' });
    }

    // Non-admin users can only access events they're assigned to
    const isAdmin = roleName === 'Admin';
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      const memberId = teamMember?.memberId;
      
      const isTeamMember = memberId && clientEvent.teamMembersAssigned?.includes(memberId);
      const isEditor = clientEvent.albumEditor === userId || clientEvent.albumEditor === memberId;
      const isDesigner = clientEvent.albumDesigner === userId || clientEvent.albumDesigner === memberId;
      
      if (!isTeamMember && !isEditor && !isDesigner) {
        logger.warn(`[${requestId}] Access denied - not assigned`, { tenantId, clientEventId, userId });
        return res.status(403).json({ message: 'Access denied. You can only view events you are assigned to.' });
      }
    }

    logger.info(`[${requestId}] Client event retrieved`, { tenantId, clientEventId });

    return res.status(200).json({ clientEvent });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching client event`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateClientEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Updating client event`, { tenantId, clientEventId });

  try {
    // Don't allow updating clientEventId or tenantId
    delete updates.clientEventId;
    delete updates.tenantId;

    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied - tenant mismatch`, { tenantId, clientEventId });
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
        logger.warn(`[${requestId}] Access denied - unauthorized fields`, { 
          tenantId,
          clientEventId,
          userId,
          attemptedFields: updateKeys 
        });
        return res.status(403).json({ 
          message: 'Access denied. You can only update the delivery status. Other fields require admin access.' 
        });
      }
    }

    // Add updatedBy field
    updates.updatedBy = userId;

    // Get current event to track status changes
    const currentEvent = await ClientEvent.findOne({ clientEventId });
    
    // Track if we need to notify assigned users
    let notifyEditorAssignment = false;
    let notifyDesignerAssignment = false;
    
    // Track old status for status change notifications
    const oldStatusId = currentEvent?.eventDeliveryStatusId;
    
    // If albumEditor is being assigned (and not being removed), set status to EDITING_ONGOING
    if (updates.albumEditor && updates.albumEditor !== currentEvent?.albumEditor) {
      const editingStatus = await EventDeliveryStatus.findOne({
        tenantId: { $in: [tenantId, -1] },
        statusCode: 'EDITING_ONGOING'
      });
      if (editingStatus) {
        updates.eventDeliveryStatusId = editingStatus.statusId;
      }
      notifyEditorAssignment = true;
    }
    
    // If albumDesigner is being assigned (and not being removed), set status to ALBUM_DESIGN_ONGOING
    if (updates.albumDesigner && updates.albumDesigner !== currentEvent?.albumDesigner) {
      const designStatus = await EventDeliveryStatus.findOne({
        tenantId: { $in: [tenantId, -1] },
        statusCode: 'ALBUM_DESIGN_ONGOING'
      });
      if (designStatus) {
        updates.eventDeliveryStatusId = designStatus.statusId;
      }
      notifyDesignerAssignment = true;
    }

    const updatedClientEvent = await ClientEvent.findOneAndUpdate(
      { clientEventId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Send notifications after update
    if (updatedClientEvent) {
      const project = await Project.findOne({ projectId: updatedClientEvent.projectId });
      const projectName = project?.projectName || 'Unknown Project';
      
      // Get event name from Event model
      const event = await Event.findOne({ eventId: updatedClientEvent.eventId });
      const eventName = event?.eventDesc || 'event';

      // Notify editor if they were assigned (need to get userId from memberId)
      if (notifyEditorAssignment && updates.albumEditor) {
        const editorMember = await Team.findOne({ memberId: updates.albumEditor });
        if (editorMember?.userId) {
          await NotificationUtils.notifyUserAssignment(
            editorMember.userId,
            tenantId,
            eventName,
            projectName,
            'editor',
            updates.editingDueDate
          );

          // Create todo for the editor
          await createEditorAssignmentTodo(
            tenantId,
            editorMember.userId,
            eventName,
            projectName,
            updatedClientEvent.projectId,
            updatedClientEvent.clientEventId,
            updates.editingDueDate,
            updatedClientEvent.toDatetime,
            requestId
          );
        }
      }

      // Notify designer if they were assigned (need to get userId from memberId)
      if (notifyDesignerAssignment && updates.albumDesigner) {
        const designerMember = await Team.findOne({ memberId: updates.albumDesigner });
        if (designerMember?.userId) {
          await NotificationUtils.notifyUserAssignment(
            designerMember.userId,
            tenantId,
            eventName,
            projectName,
            'designer',
            updates.albumDesignDueDate
          );

          // Create todo for the designer
          await createDesignerAssignmentTodo(
            tenantId,
            designerMember.userId,
            eventName,
            projectName,
            updatedClientEvent.projectId,
            updatedClientEvent.clientEventId,
            updates.albumDesignDueDate,
            updatedClientEvent.toDatetime,
            requestId
          );
        }
      }

      // Check for status changes
      if (updates.eventDeliveryStatusId && oldStatusId !== updates.eventDeliveryStatusId) {
        logger.info('Status change detected', {
          tenantId,
          clientEventId: updatedClientEvent.clientEventId,
          oldStatusId,
          newStatusId: updates.eventDeliveryStatusId
        });

        const [oldStatus, newStatus] = await Promise.all([
          oldStatusId ? EventDeliveryStatus.findOne({ statusId: oldStatusId }) : null,
          EventDeliveryStatus.findOne({ statusId: updatedClientEvent.eventDeliveryStatusId })
        ]);

        logger.info('Status codes', {
          tenantId,
          clientEventId: updatedClientEvent.clientEventId,
          oldStatusCode: oldStatus?.statusCode,
          newStatusCode: newStatus?.statusCode
        });

        // If status changed from SCHEDULED to SHOOT_IN_PROGRESS, notify admins
        if (oldStatus?.statusCode === 'SCHEDULED' && newStatus?.statusCode === 'SHOOT_IN_PROGRESS') {
          logger.info('Triggering shoot in progress notification', { tenantId, clientEventId });
          await NotificationUtils.notifyShootInProgress(
            updatedClientEvent,
            projectName
          );
        }

        // If status is AWAITING_EDITING and no editor assigned, notify admins
        if (newStatus?.statusCode === 'AWAITING_EDITING' && !updatedClientEvent.albumEditor) {
          logger.info('Triggering awaiting editing notification', { tenantId, clientEventId });
          await NotificationUtils.notifyAssignEditorNeeded(
            updatedClientEvent,
            projectName
          );
        }

        // Check if all events in the project are now in DELIVERY status
        if (newStatus?.statusCode === 'DELIVERY') {
          await checkAndUpdateProjectStatus(updatedClientEvent.projectId, tenantId!);
        }
      }
    }

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ClientEvent',
      entityId: clientEventId,
      tenantId: tenantId!,
      performedBy: userId || 'System',
      changes: updates,
      metadata: { projectId: clientEvent.projectId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Client event updated`, { tenantId, clientEventId });

    return res.status(200).json({
      message: 'Client event updated successfully',
      clientEvent: updatedClientEvent
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating client event`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteClientEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting client event`, { tenantId, clientEventId });

  try {
    const clientEvent = await ClientEvent.findOne({ clientEventId });

    if (!clientEvent) {
      logger.warn(`[${requestId}] Client event not found`, { tenantId, clientEventId });
      return res.status(404).json({ message: 'Client event not found' });
    }

    // Check authorization
    if (clientEvent.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, clientEventId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant client events.' });
    }

    await ClientEvent.deleteOne({ clientEventId });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ClientEvent',
      entityId: clientEventId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { deleted: true, projectId: clientEvent.projectId },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Client event deleted`, { tenantId, clientEventId });

    return res.status(200).json({
      message: 'Client event deleted successfully',
      clientEventId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting client event`, { 
      tenantId,
      clientEventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClientEventsByProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching client events by project`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
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
        logger.info(`[${requestId}] User not a team member`, { tenantId, userId, projectId });
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

    logger.info(`[${requestId}] Client events by project retrieved`, { 
      tenantId,
      projectId,
      count: clientEvents.length,
      isAdmin 
    });

    return res.status(200).json({
      message: 'Client events retrieved successfully',
      count: clientEvents.length,
      clientEvents
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching client events by project`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadAlbumPdf = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId, clientEventId, clientEventIds } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Uploading album PDF`, { tenantId, projectId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      logger.warn(`[${requestId}] Project ID missing`, { tenantId });
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
      logger.warn(`[${requestId}] No valid event IDs provided`, { tenantId, projectId });
      return res.status(400).json({ message: 'At least one client event ID is required' });
    }

    const file = req.file;
    if (!file) {
      logger.warn(`[${requestId}] No file uploaded`, { tenantId, projectId });
      return res.status(400).json({ message: 'Album PDF file is required' });
    }

    if (file.mimetype !== 'application/pdf') {
      logger.warn(`[${requestId}] Invalid file type`, { tenantId, projectId, mimetype: file.mimetype });
      return res.status(400).json({ message: 'Only PDF files are allowed for album uploads' });
    }

    const clientEvents = await ClientEvent.find({ tenantId, clientEventId: { $in: targetEventIds } });
    if (clientEvents.length !== targetEventIds.length) {
      const foundIds = clientEvents.map((evt) => evt.clientEventId);
      const missing = targetEventIds.filter((id) => !foundIds.includes(id));
      logger.warn(`[${requestId}] Some events not found`, { tenantId, projectId, missing });
      return res.status(404).json({ message: `Client events not found: ${missing.join(', ')}` });
    }

    const hasMismatchedProject = clientEvents.some((evt) => evt.projectId !== projectId);
    if (hasMismatchedProject) {
      logger.warn(`[${requestId}] Event project mismatch`, { tenantId, projectId });
      return res.status(400).json({ message: 'One or more client events do not belong to the specified project' });
    }

    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get main bucket name
    const bucketName = await getMainBucketName();

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
      } catch (deleteError: any) {
        logger.error(`[${requestId}] Failed to delete existing PDF`, { 
          tenantId,
          projectId,
          pdfId: existingPdf.albumId,
          error: deleteError.message 
        });
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
      tenantId: { $in: [tenantId, -1] },
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

    // Send notification to admins
    try {
      // Get designer name
      const designerUser = await User.findOne({ userId, tenantId });
      const designerTeamMember = await Team.findOne({ userId, tenantId });
      const designerName = designerTeamMember 
        ? `${designerTeamMember.firstName} ${designerTeamMember.lastName}` 
        : designerUser?.email || 'Designer';

      // Get event names
      const events = await Event.find({ 
        eventId: { $in: clientEvents.map(ce => ce.eventId) } 
      });
      const eventNames = events.map(e => e.eventDesc).join(', ');

      await NotificationUtils.notifyAlbumPdfUploaded(
        tenantId,
        designerName,
        project.projectName,
        eventNames,
        1,
        userId
      );
    } catch (notifError: any) {
      logger.error(`[${requestId}] Failed to send album PDF upload notification`, { 
        tenantId,
        projectId,
        error: notifError.message 
      });
      // Don't fail the request if notification fails
    }

    logger.info(`[${requestId}] Album PDF uploaded`, { 
      tenantId,
      projectId,
      albumId: albumPdf.albumId,
      deletedCount,
      eventsCount: targetEventIds.length 
    });

    return res.status(200).json({
      message: deletedCount > 0 ? `Replaced ${deletedCount} existing PDF${deletedCount > 1 ? 's' : ''}` : 'Album PDF uploaded successfully',
      albumPdf: albumPdf.toObject(),
      deletedCount
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Failed to upload album PDF`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Failed to upload album PDF' });
  }
};

export const uploadAlbumPdfBatch = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId, mappings } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const files = req.files as Express.Multer.File[];

  logger.info(`[${requestId}] Batch uploading album PDFs`, { tenantId, projectId, filesCount: files?.length });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    if (!projectId) {
      logger.warn(`[${requestId}] Project ID missing`, { tenantId });
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!files || files.length === 0) {
      logger.warn(`[${requestId}] No files uploaded`, { tenantId, projectId });
      return res.status(400).json({ message: 'At least one PDF file is required' });
    }

    if (!mappings) {
      logger.warn(`[${requestId}] Mappings missing`, { tenantId, projectId });
      return res.status(400).json({ message: 'Mappings are required' });
    }

    let parsedMappings;
    try {
      parsedMappings = JSON.parse(mappings);
    } catch (err) {
      logger.warn(`[${requestId}] Invalid mappings format`, { tenantId, projectId });
      return res.status(400).json({ message: 'Invalid mappings format' });
    }

    if (!Array.isArray(parsedMappings) || parsedMappings.length === 0) {
      logger.warn(`[${requestId}] Mappings must be non-empty array`, { tenantId, projectId });
      return res.status(400).json({ message: 'Mappings must be a non-empty array' });
    }

    if (files.length !== parsedMappings.length) {
      logger.warn(`[${requestId}] Files and mappings count mismatch`, { 
        tenantId,
        projectId,
        filesCount: files.length,
        mappingsCount: parsedMappings.length 
      });
      return res.status(400).json({ message: 'Number of files must match number of mappings' });
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        logger.warn(`[${requestId}] Non-PDF file detected`, { 
          tenantId,
          projectId,
          fileName: file.originalname,
          mimetype: file.mimetype 
        });
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
      logger.warn(`[${requestId}] Some events not found in batch`, { tenantId, projectId, missing });
      return res.status(404).json({ message: `Client events not found: ${missing.join(', ')}` });
    }

    const hasMismatchedProject = clientEvents.some((evt) => evt.projectId !== projectId);
    if (hasMismatchedProject) {
      logger.warn(`[${requestId}] Event project mismatch in batch`, { tenantId, projectId });
      return res.status(400).json({ message: 'One or more client events do not belong to the specified project' });
    }

    const project = await Project.findOne({ projectId, tenantId });
    if (!project) {
      logger.warn(`[${requestId}] Project not found for batch upload`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get main bucket name
    const bucketName = await getMainBucketName();

    // Delete ALL existing PDFs for this project
    const existingPdfs = await AlbumPdf.find({ tenantId, projectId });
    let deletedCount = 0;
    for (const existingPdf of existingPdfs) {
      try {
        await deleteFromS3(existingPdf.albumPdfUrl);
        await AlbumPdf.deleteOne({ _id: existingPdf._id });
        deletedCount++;
      } catch (deleteError: any) {
        logger.error(`[${requestId}] Failed to delete existing PDF in batch`, { 
          tenantId,
          projectId,
          pdfId: existingPdf.albumId,
          error: deleteError.message 
        });
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
        tenantId: { $in: [tenantId, -1] },
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

    // Send notification to admins
    if (createdPdfs.length > 0) {
      try {
        // Get designer name
        const designerUser = await User.findOne({ userId, tenantId });
        const designerTeamMember = await Team.findOne({ userId, tenantId });
        const designerName = designerTeamMember 
          ? `${designerTeamMember.firstName} ${designerTeamMember.lastName}` 
          : designerUser?.email || 'Designer';

        // Get event names
        const events = await Event.find({ 
          eventId: { $in: clientEvents.map(ce => ce.eventId) } 
        });
        const eventNames = events.map(e => e.eventDesc).join(', ');

        await NotificationUtils.notifyAlbumPdfUploaded(
          tenantId,
          designerName,
          project.projectName,
          eventNames,
          createdPdfs.length,
          userId
        );
      } catch (notifError: any) {
        logger.error(`[${requestId}] Failed to send batch album PDF upload notification`, { 
          tenantId,
          projectId,
          error: notifError.message 
        });
        // Don't fail the request if notification fails
      }
    }

    logger.info(`[${requestId}] Batch album PDFs uploaded`, { 
      tenantId,
      projectId,
      uploadedCount: createdPdfs.length,
      deletedCount 
    });

    return res.status(200).json({
      message: `Successfully uploaded ${createdPdfs.length} PDF${createdPdfs.length > 1 ? 's' : ''}`,
      albumPdfs: createdPdfs,
      deletedCount,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Batch upload album PDF error`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Failed to upload album PDFs' });
  }
};

export const approveAlbumDesign = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { clientEventId } = req.body;
  const userId = req.user?.userId;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Approving album design`, { tenantId, clientEventId });

  try {
    if (!clientEventId) {
      logger.warn(`[${requestId}] Client Event ID missing`, { tenantId });
      return res.status(400).json({ error: 'Client Event ID is required' });
    }

    // Find ALBUM_PRINTING status
    const albumPrintingStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'ALBUM_PRINTING'
    });

    if (!albumPrintingStatus) {
      logger.warn(`[${requestId}] Album Printing status not found`, { tenantId });
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
      logger.warn(`[${requestId}] Client Event not found for approval`, { tenantId, clientEventId });
      return res.status(404).json({ error: 'Client Event not found' });
    }

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'ClientEvent',
      entityId: clientEventId,
      tenantId: tenantId!,
      performedBy: userId || 'System',
      changes: { eventDeliveryStatusId: albumPrintingStatus.statusId, approved: true },
      metadata: { action: 'album_design_approved' },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Album design approved`, { tenantId, clientEventId });

    res.status(200).json({ 
      message: 'Album design approved successfully, printing in progress',
      clientEvent: updatedEvent
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error approving album design`, { 
      tenantId,
      clientEventId,
      error: error.message,
      stack: error.stack 
    });
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

