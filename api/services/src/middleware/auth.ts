import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Role from '../models/role';
import { RoleName, Permission, hasPermission, loadRolesFromDB } from '../constants/roles';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    tenantId: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user exists and is active (filter by both userId and tenantId for security)
    const user = await User.findOne({ 
      userId: decoded.userId,
      tenantId: decoded.tenantId
    });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      tenantId: decoded.tenantId
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const authorize = (allowedRoles: readonly RoleName[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.roleName as RoleName)) {
      console.warn(`Authorization failed: User ${req.user.email} with role ${req.user.roleName} attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.roleName
      });
    }

    next();
  };
};

// Enhanced authorization that validates role against database
export const authorizeWithDbValidation = (allowedRoles: readonly RoleName[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      // Verify the user's role still exists and is valid in the database
      const roleExists = await Role.findById(req.user.roleId);
      if (!roleExists) {
        return res.status(401).json({
          success: false,
          message: 'Invalid role - please re-authenticate'
        });
      }

      // Check if the role name matches what's in the JWT (in case role was updated)
      if (roleExists.name !== req.user.roleName) {
        return res.status(401).json({
          success: false,
          message: 'Role information outdated - please re-authenticate'
        });
      }

      if (!allowedRoles.includes(req.user.roleName as RoleName)) {
        console.warn(`Authorization failed: User ${req.user.email} with role ${req.user.roleName} attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredRoles: allowedRoles,
          userRole: req.user.roleName
        });
      }

      next();
    } catch (error) {
      console.error('Database role validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization validation failed'
      });
    }
  };
};

export const requirePasswordSet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check user's password status from database
    const user = await User.findOne({ 
      userId: req.user.userId,
      tenantId: req.user.tenantId
    });

    if (!user || !user.isPasswordSet) {
      return res.status(403).json({
        success: false,
        message: 'Password must be set before accessing this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Password check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password validation failed'
    });
  }
};

// Permission-based authorization - works with any roles in database
export const authorizePermission = (permission: Permission) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const hasAccess = await hasPermission(req.user.roleName, permission);
      
      if (!hasAccess) {
        console.warn(`Permission denied: User ${req.user.email} with role ${req.user.roleName} attempted to access endpoint requiring permission: ${permission}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredPermission: permission,
          userRole: req.user.roleName
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Middleware to validate that user's role exists in database
export const validateRoleExists = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const roles = await loadRolesFromDB();
    
    if (!roles.has(req.user.roleName.toLowerCase())) {
      console.warn(`Invalid role detected: ${req.user.roleName} for user ${req.user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid role - please re-authenticate'
      });
    }

    next();
  } catch (error) {
    console.error('Role validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Role validation failed'
    });
  }
};

// Utility function to check if a role is allowed (deprecated - use authorizePermission instead)
export const hasRole = (userRole: string, allowedRoles: readonly RoleName[]): boolean => {
  return allowedRoles.includes(userRole as RoleName);
};