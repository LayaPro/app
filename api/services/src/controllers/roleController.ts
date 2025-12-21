import { Response } from 'express';
import { nanoid } from 'nanoid';
import Role from '../models/role';
import { AuthRequest } from '../middleware/auth';

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if role with same name exists for this tenant
    const existing = await Role.findOne({ name, tenantId });
    if (existing) return res.status(409).json({ message: 'Role already exists for this tenant' });
    
    const roleId = `role_${nanoid()}`;
    const doc = await Role.create({ roleId, name, description, tenantId });
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error('createRole error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // Always exclude superadmin role
    // Include admin role (global) and tenant-specific roles only
    const query = {
      name: { $ne: 'superadmin' }, // Never show superadmin
      $or: [
        { tenantId: '-1' }, // Global roles (admin)
        { tenantId } // User's own tenant roles
      ]
    };
    
    const docs = await Role.find(query).sort({ createdAt: -1 }).lean();
    return res.json(docs);
  } catch (err: any) {
    console.error('getRoles error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export default { createRole, getRoles };
