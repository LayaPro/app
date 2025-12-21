import { Response } from 'express';
import { nanoid } from 'nanoid';
import ProjectDeliveryStatus from '../models/projectDeliveryStatus';
import { AuthRequest } from '../middleware/auth';

export const createProjectDeliveryStatus = async (req: AuthRequest, res: Response) => {
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
    const existing = await ProjectDeliveryStatus.findOne({ statusCode, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'Project delivery status with this code already exists for your tenant' });
    }

    const statusId = `status_${nanoid()}`;
    const projectDeliveryStatus = await ProjectDeliveryStatus.create({
      statusId,
      tenantId,
      statusCode,
      step,
      lastUpdatedDate: new Date(),
      updatedBy: req.user?.userId
    });

    return res.status(201).json({
      message: 'Project delivery status created successfully',
      projectDeliveryStatus
    });
  } catch (err: any) {
    console.error('Create project delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProjectDeliveryStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users (including superadmin) only see their own tenant's statuses
    const projectDeliveryStatuses = await ProjectDeliveryStatus.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Project delivery statuses retrieved successfully',
      count: projectDeliveryStatuses.length,
      projectDeliveryStatuses
    });
  } catch (err: any) {
    console.error('Get all project delivery statuses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectDeliveryStatusById = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const projectDeliveryStatus = await ProjectDeliveryStatus.findOne({ statusId });

    if (!projectDeliveryStatus) {
      return res.status(404).json({ message: 'Project delivery status not found' });
    }

    // Check authorization: all users can only access their own tenant's statuses
    if (projectDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant project delivery statuses.' });
    }

    return res.status(200).json({ projectDeliveryStatus });
  } catch (err: any) {
    console.error('Get project delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProjectDeliveryStatus = async (req: AuthRequest, res: Response) => {
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

    const projectDeliveryStatus = await ProjectDeliveryStatus.findOne({ statusId });

    if (!projectDeliveryStatus) {
      return res.status(404).json({ message: 'Project delivery status not found' });
    }

    // Check authorization: all users can only update their own tenant's statuses
    if (projectDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant project delivery statuses.' });
    }

    const updatedProjectDeliveryStatus = await ProjectDeliveryStatus.findOneAndUpdate(
      { statusId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Project delivery status updated successfully',
      projectDeliveryStatus: updatedProjectDeliveryStatus
    });
  } catch (err: any) {
    console.error('Update project delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProjectDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { statusId } = req.params;
    const tenantId = req.user?.tenantId;

    const projectDeliveryStatus = await ProjectDeliveryStatus.findOne({ statusId });

    if (!projectDeliveryStatus) {
      return res.status(404).json({ message: 'Project delivery status not found' });
    }

    // Check authorization: all users can only delete their own tenant's statuses
    if (projectDeliveryStatus.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant project delivery statuses.' });
    }

    await ProjectDeliveryStatus.deleteOne({ statusId });

    return res.status(200).json({
      message: 'Project delivery status deleted successfully',
      statusId
    });
  } catch (err: any) {
    console.error('Delete project delivery status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createProjectDeliveryStatus,
  getAllProjectDeliveryStatuses,
  getProjectDeliveryStatusById,
  updateProjectDeliveryStatus,
  deleteProjectDeliveryStatus
};
