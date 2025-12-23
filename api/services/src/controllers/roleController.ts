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

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const role = await Role.findOne({ roleId, tenantId });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent updating global roles (admin) or superadmin
    if (role.tenantId === '-1' || role.name === 'superadmin') {
      return res.status(403).json({ message: 'Cannot update system roles' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== role.name) {
      const existing = await Role.findOne({ name, tenantId, roleId: { $ne: roleId } });
      if (existing) {
        return res.status(409).json({ message: 'Role with this name already exists' });
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    await role.save();

    return res.status(200).json({
      message: 'Role updated successfully',
      role
    });
  } catch (err: any) {
    console.error('updateRole error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const role = await Role.findOne({ roleId, tenantId });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deleting global roles or superadmin
    if (role.tenantId === '-1' || role.name === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete system roles' });
    }

    // Check if any users are assigned this role
    const User = require('../models/user').default;
    const usersWithRole = await User.countDocuments({ roleId, tenantId });
    
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }

    await Role.deleteOne({ roleId, tenantId });

    return res.status(200).json({
      message: 'Role deleted successfully'
    });
  } catch (err: any) {
    console.error('deleteRole error:', err);
    return res.status(500).json({ message: 'internal server error' });
  }
};

export default { createRole, getRoles, updateRole, deleteRole };
