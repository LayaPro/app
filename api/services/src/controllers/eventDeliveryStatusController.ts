import { Response } from 'express';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import { AuthRequest } from '../middleware/auth';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('EventDeliveryStatusController');

export const createEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.warn(`[${requestId}] Attempted to create event delivery status manually`, { tenantId });

  try {
    return res.status(403).json({
      message: 'Event workflow steps are managed by the system and cannot be created manually.'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error in create event delivery status`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEventDeliveryStatuses = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all event delivery statuses`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Include both global statuses (tenantId: -1) and tenant-specific statuses
    const eventDeliveryStatuses = await EventDeliveryStatus.find({ tenantId: { $in: [tenantId, -1] } }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Event delivery statuses retrieved`, { tenantId, count: eventDeliveryStatuses.length });

    return res.status(200).json({
      message: 'Event delivery statuses retrieved successfully',
      count: eventDeliveryStatuses.length,
      eventDeliveryStatuses
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event delivery statuses`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventDeliveryStatusById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { statusId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching event delivery status by ID`, { tenantId, statusId });

  try {
    const eventDeliveryStatus = await EventDeliveryStatus.findOne({ statusId });

    if (!eventDeliveryStatus) {
      logger.warn(`[${requestId}] Event delivery status not found`, { tenantId, statusId });
      return res.status(404).json({ message: 'Event delivery status not found' });
    }

    // Check authorization: all users can only access their own tenant's statuses
    if (eventDeliveryStatus.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, statusId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant event delivery statuses.' });
    }

    logger.info(`[${requestId}] Event delivery status retrieved`, { tenantId, statusId });

    return res.status(200).json({ eventDeliveryStatus });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching event delivery status`, { 
      tenantId,
      statusId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { statusId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating event delivery status`, { tenantId, statusId });

  try {
    // Don't allow updating statusId or tenantId
    delete updates.statusId;
    delete updates.tenantId;

    // Update tracking fields
    updates.lastUpdatedDate = new Date();
    updates.updatedBy = userId;

    const eventDeliveryStatus = await EventDeliveryStatus.findOne({ statusId });

    if (!eventDeliveryStatus) {
      logger.warn(`[${requestId}] Event delivery status not found`, { tenantId, statusId });
      return res.status(404).json({ message: 'Event delivery status not found' });
    }

    // Check authorization: all users can only update their own tenant's statuses
    if (eventDeliveryStatus.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, statusId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant event delivery statuses.' });
    }

    const updatedEventDeliveryStatus = await EventDeliveryStatus.findOneAndUpdate(
      { statusId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'EventDeliveryStatus',
      entityId: statusId,
      tenantId,
      performedBy: userId || 'System',
      changes: updates,
      metadata: {},
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Event delivery status updated`, { tenantId, statusId });

    return res.status(200).json({
      message: 'Event delivery status updated successfully',
      eventDeliveryStatus: updatedEventDeliveryStatus
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating event delivery status`, { 
      tenantId,
      statusId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.warn(`[${requestId}] Attempted to delete event delivery status`, { tenantId });

  try {
    return res.status(403).json({
      message: 'Event workflow steps are system-managed and cannot be deleted.'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error in delete event delivery status`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpdateSteps = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { statuses } = req.body; // Array of { statusId, step }
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Bulk updating delivery steps`, { tenantId, statusCount: statuses?.length });

  try {
    if (!statuses || !Array.isArray(statuses)) {
      logger.warn(`[${requestId}] Statuses array missing`, { tenantId });
      return res.status(400).json({ message: 'Statuses array is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Verify all statuses belong to the user's tenant
    const statusIds = statuses.map(s => s.statusId);
    const existingStatuses = await EventDeliveryStatus.find({ 
      statusId: { $in: statusIds },
      tenantId 
    });

    if (existingStatuses.length !== statuses.length) {
      logger.warn(`[${requestId}] Access denied - status mismatch`, { tenantId, expected: statuses.length, found: existingStatuses.length });
      return res.status(403).json({ message: 'Access denied. Some statuses do not belong to your tenant.' });
    }

    // Update each status with new step
    const updatePromises = statuses.map(({ statusId, step }) =>
      EventDeliveryStatus.findOneAndUpdate(
        { statusId, tenantId },
        { 
          $set: { 
            step,
            lastUpdatedDate: new Date(),
            updatedBy: userId
          }
        },
        { new: true }
      )
    );

    const updatedStatuses = await Promise.all(updatePromises);

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'EventDeliveryStatus',
      entityId: 'bulk_update',
      tenantId,
      performedBy: userId || 'System',
      changes: { statuses },
      metadata: { statusCount: statuses.length },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Delivery steps bulk updated`, { tenantId, updatedCount: updatedStatuses.length });

    return res.status(200).json({
      message: 'Event delivery status order updated successfully',
      eventDeliveryStatuses: updatedStatuses
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error bulk updating steps`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEventDeliveryStatus,
  getAllEventDeliveryStatuses,
  getEventDeliveryStatusById,
  updateEventDeliveryStatus,
  deleteEventDeliveryStatus,
  bulkUpdateSteps
};

