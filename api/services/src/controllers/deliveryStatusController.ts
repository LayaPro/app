import { Response } from 'express';
import { nanoid } from 'nanoid';
import DeliveryStatus from '../models/deliveryStatus';
import { AuthRequest } from '../middleware/auth';

export const createDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusCode } = req.body;
    const tenantId = req.user?.tenantId;

    if (!statusCode) {
      return res.status(400).json({ message: 'Status code is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if status with same code exists for this tenant
    const existing = await DeliveryStatus.findOne({ statusCode, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'Delivery status with this code already exists for your tenant' });
    }

    const statusId = `status_${nanoid()}`;
    const deliveryStatus = await DeliveryStatus.create({
      statusId,
      tenantId,
      statusCode,
      lastUpdatedDate: new Date(),
      updatedBy: req.user?.userId
    });

    return res.status(201).json({
      message: 'Delivery status created successfully',
      deliveryStatus
    });
  } catch (err: any) {
    console.error('Create delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllDeliveryStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users (including superadmin) only see their own tenant's statuses
    const deliveryStatuses = await DeliveryStatus.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Delivery statuses retrieved successfully',
      count: deliveryStatuses.length,
      deliveryStatuses
    });
  } catch (err: any) {
    console.error('Get all delivery statuses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDeliveryStatusById = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const deliveryStatus = await DeliveryStatus.findOne({ statusId });

    if (!deliveryStatus) {
      return res.status(404).json({ message: 'Delivery status not found' });
    }

    // Check authorization: all users can only access their own tenant's statuses
    if (deliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant delivery statuses.' });
    }

    return res.status(200).json({ deliveryStatus });
  } catch (err: any) {
    console.error('Get delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
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

    const deliveryStatus = await DeliveryStatus.findOne({ statusId });

    if (!deliveryStatus) {
      return res.status(404).json({ message: 'Delivery status not found' });
    }

    // Check authorization: all users can only update their own tenant's statuses
    if (deliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant delivery statuses.' });
    }

    const updatedDeliveryStatus = await DeliveryStatus.findOneAndUpdate(
      { statusId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Delivery status updated successfully',
      deliveryStatus: updatedDeliveryStatus
    });
  } catch (err: any) {
    console.error('Update delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const deliveryStatus = await DeliveryStatus.findOne({ statusId });

    if (!deliveryStatus) {
      return res.status(404).json({ message: 'Delivery status not found' });
    }

    // Check authorization: all users can only delete their own tenant's statuses
    if (deliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant delivery statuses.' });
    }

    await DeliveryStatus.deleteOne({ statusId });

    return res.status(200).json({
      message: 'Delivery status deleted successfully',
      statusId
    });
  } catch (err: any) {
    console.error('Delete delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createDeliveryStatus,
  getAllDeliveryStatuses,
  getDeliveryStatusById,
  updateDeliveryStatus,
  deleteDeliveryStatus
};
