import { Response } from 'express';
import ImageStatus from '../models/imageStatus';
import { AuthRequest } from '../middleware/auth';

export const getAllImageStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Include both global statuses (tenantId: -1) and tenant-specific statuses
    const imageStatuses = await ImageStatus.find({ tenantId: { $in: [tenantId, -1] } }).sort({ step: 1 }).lean();

    return res.status(200).json({
      message: 'Image statuses retrieved successfully',
      count: imageStatuses.length,
      imageStatuses
    });
  } catch (err: any) {
    console.error('Get all image statuses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getAllImageStatuses
};
