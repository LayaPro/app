import { Response } from 'express';
import { nanoid } from 'nanoid';
import Event from '../models/event';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('EventController');

export const createEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventCode, eventDesc, eventAlias } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating event`, { tenantId, eventCode });

  try {
    if (!eventCode || !eventDesc) {
      logger.warn(`[${requestId}] Missing required fields`, { tenantId });
      return res.status(400).json({ message: 'Event code and description are required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if event with same code exists for this tenant
    const existing = await Event.findOne({ eventCode, tenantId });
    if (existing) {
      logger.warn(`[${requestId}] Event code already exists`, { tenantId, eventCode });
      return res.status(409).json({ message: 'Event with this code already exists for your tenant' });
    }

    const eventId = `event_${nanoid()}`;
    const event = await Event.create({
      eventId,
      tenantId,
      eventCode,
      eventDesc,
      eventAlias
    });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Event',
      entityId: eventId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { eventCode, eventDesc },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event created`, { tenantId, eventId, eventCode });

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating event`, { 
      tenantId,
      eventCode,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all events`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Include both global events (tenantId: -1) and tenant-specific events
    const events = await Event.find({ tenantId: { $in: [tenantId, -1] } }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Events retrieved`, { tenantId, count: events.length });

    return res.status(200).json({
      message: 'Events retrieved successfully',
      count: events.length,
      events
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching events`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching event by ID`, { tenantId, eventId });

  try {
    const event = await Event.findOne({ eventId });

    if (!event) {
      logger.warn(`[${requestId}] Event not found`, { tenantId, eventId });
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only access their own tenant's events
    if (event.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant events.' });
    }

    logger.info(`[${requestId}] Event retrieved`, { tenantId, eventId });

    return res.status(200).json({ event });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event`, { 
      tenantId,
      eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating event`, { tenantId, eventId });

  try {
    // Don't allow updating eventId or tenantId
    delete updates.eventId;
    delete updates.tenantId;

    const event = await Event.findOne({ eventId });

    if (!event) {
      logger.warn(`[${requestId}] Event not found`, { tenantId, eventId });
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only update their own tenant's events
    if (event.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant events.' });
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { eventId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Event',
      entityId: eventId,
      tenantId,
      performedBy: userId || 'System',
      changes: updates,
      metadata: {},
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event updated`, { tenantId, eventId });

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating event`, { 
      tenantId,
      eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { eventId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting event`, { tenantId, eventId });

  try {
    const event = await Event.findOne({ eventId });

    if (!event) {
      logger.warn(`[${requestId}] Event not found`, { tenantId, eventId });
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: all users can only delete their own tenant's events
    if (event.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, eventId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant events.' });
    }

    await Event.deleteOne({ eventId });

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Event',
      entityId: eventId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: { deleted: true, eventCode: event.eventCode },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event deleted`, { tenantId, eventId });

    return res.status(200).json({
      message: 'Event deleted successfully',
      eventId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting event`, { 
      tenantId,
      eventId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
