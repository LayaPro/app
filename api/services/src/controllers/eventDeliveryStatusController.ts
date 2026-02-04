import { Response } from 'express';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import { AuthRequest } from '../middleware/auth';

export const createEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(403).json({
      message: 'Event workflow steps are managed by the system and cannot be created manually.'
    });
  } catch (err: any) {
    console.error('Create event delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEventDeliveryStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Include both global statuses (tenantId: -1) and tenant-specific statuses
    const eventDeliveryStatuses = await EventDeliveryStatus.find({ tenantId: { $in: [tenantId, -1] } }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Event delivery statuses retrieved successfully',
      count: eventDeliveryStatuses.length,
      eventDeliveryStatuses
    });
  } catch (err: any) {
    console.error('Get all event delivery statuses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventDeliveryStatusById = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const eventDeliveryStatus = await EventDeliveryStatus.findOne({ statusId });

    if (!eventDeliveryStatus) {
      return res.status(404).json({ message: 'Event delivery status not found' });
    }

    // Check authorization: all users can only access their own tenant's statuses
    if (eventDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant event delivery statuses.' });
    }

    return res.status(200).json({ eventDeliveryStatus });
  } catch (err: any) {
    console.error('Get event delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating statusId or tenantId
    delete updates.statusId;
    delete updates.tenantId;

    // Update tracking fields
    updates.lastUpdatedDate = new Date();
    updates.updatedBy = req.user?.userId;

    const eventDeliveryStatus = await EventDeliveryStatus.findOne({ statusId });

    if (!eventDeliveryStatus) {
      return res.status(404).json({ message: 'Event delivery status not found' });
    }

    // Check authorization: all users can only update their own tenant's statuses
    if (eventDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant event delivery statuses.' });
    }

    const updatedEventDeliveryStatus = await EventDeliveryStatus.findOneAndUpdate(
      { statusId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Event delivery status updated successfully',
      eventDeliveryStatus: updatedEventDeliveryStatus
    });
  } catch (err: any) {
    console.error('Update event delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(403).json({
      message: 'Event workflow steps are system-managed and cannot be deleted.'
    });
  } catch (err: any) {
    console.error('Delete event delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpdateSteps = async (req: AuthRequest, res: Response) => {
  try {
    const { statuses } = req.body; // Array of { statusId, step }
    const tenantId = req.user?.tenantId;

    if (!statuses || !Array.isArray(statuses)) {
      return res.status(400).json({ message: 'Statuses array is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Verify all statuses belong to the user's tenant
    const statusIds = statuses.map(s => s.statusId);
    const existingStatuses = await EventDeliveryStatus.find({ 
      statusId: { $in: statusIds },
      tenantId 
    });

    if (existingStatuses.length !== statuses.length) {
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
            updatedBy: req.user?.userId
          }
        },
        { new: true }
      )
    );

    const updatedStatuses = await Promise.all(updatePromises);

    return res.status(200).json({
      message: 'Event delivery status order updated successfully',
      eventDeliveryStatuses: updatedStatuses
    });
  } catch (err: any) {
    console.error('Bulk update steps error:', err);
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

