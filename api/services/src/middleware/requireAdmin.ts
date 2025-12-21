import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const roleName = req.user.roleName;

  // Allow both admin and superadmin
  if (roleName !== 'admin' && roleName !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Admin or Superadmin role required.' });
  }

  next();
};

export default requireAdmin;
