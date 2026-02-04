import { Request, Response, NextFunction } from 'express';
import User from '../models/user';

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - userId is added by requireAuth middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if it's the hardcoded super admin
    if (userId === 'super-admin-001') {
      return next();
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isSuperAdmin) {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error in requireSuperAdmin middleware:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
