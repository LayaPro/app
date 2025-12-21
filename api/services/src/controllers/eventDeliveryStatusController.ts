import { Response } from 'express';
import { nanoid } from 'nanoid';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import { AuthRequest } from '../middleware/auth';

export const createEventDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusCode, step } = req.body;
    const tenantId = req.user?.tenantId;

    if (!statusCode || step === undefined) {
      return res.status(400).json({ message: 'Status code and step are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if status with same code exists for this tenant
    const existing = await EventDeliveryStatus.findOne({ statusCode, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'Event delivery status with this code already exists for your tenant' });
    }

    const statusId = `status_${nanoid()}`;
    const eventDeliveryStatus = await EventDeliveryStatus.create({
      statusId,
      tenantId,
      statusCode,
      step,
      lastUpdatedDate: new Date(),
      updatedBy: req.user?.userId
    });

    return res.status(201).json({
      message: 'Event delivery status created successfully',
      eventDeliveryStatus
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

    // All users (including superadmin) only see their own tenant's statuses
    const eventDeliveryStatuses = await EventDeliveryStatus.find({ tenantId }).sort({ createdAt: -1 }).lean();

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
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const eventDeliveryStatus = await EventDeliveryStatus.findOne({ statusId });

    if (!eventDeliveryStatus) {
      return res.status(404).json({ message: 'Event delivery status not found' });
    }

    // Check authorization: all users can only delete their own tenant's statuses
    if (eventDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant event delivery statuses.' });
    }

    await EventDeliveryStatus.deleteOne({ statusId });

    return res.status(200).json({
      message: 'Event delivery status deleted successfully',
      statusId
    });
  } catch (err: any) {
    console.error('Delete event delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createEventDeliveryStatus,
  getAllEventDeliveryStatuses,
  getEventDeliveryStatusById,
  updateEventDeliveryStatus,
  deleteEventDeliveryStatus
};
