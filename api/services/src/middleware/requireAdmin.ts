import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const roleName = req.user.roleName;

  // Allow only Admin
  if (roleName !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

export default requireAdmin;
