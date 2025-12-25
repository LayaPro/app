import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    tenantId: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] Request path:', req.path);
    console.log('[Auth] Auth header exists:', !!authHeader);
    console.log('[Auth] Auth header preview:', authHeader?.substring(0, 30));
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No token provided or invalid format');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('[Auth] Token extracted, length:', token.length);
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('[Auth] Token verified successfully for user:', decoded.userId);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      tenantId: decoded.tenantId
    };

    next();
  } catch (err: any) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.roleName !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin role required.' });
  }

  next();
};

export default { authenticate, requireSuperAdmin };
