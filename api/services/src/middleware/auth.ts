import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-this';

console.log('[Auth Middleware] JWT_SECRET loaded:', JWT_SECRET?.substring(0, 10) + '...');
console.log('[Auth Middleware] JWT_SECRET loaded:', JWT_SECRET?.substring(0, 10) + '...');

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
    console.log('[Auth] Full auth header:', authHeader);
    
    if (!authHeader) {
      console.log('[Auth] No authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Handle both "Bearer <token>" and just "<token>" formats
    let token: string;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
    
    console.log('[Auth] Token extracted, length:', token.length);
    console.log('[Auth] Token preview:', token.substring(0, 50) + '...');
    
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

export default { authenticate };
