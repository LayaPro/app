import { Response } from 'express';
import { nanoid } from 'nanoid';
import Role from '../models/role';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('RoleController');

export const createRole = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  try {
    const { name, description } = req.body;
    if (!name) {
      logger.warn(`[${requestId}] Role name required`, { tenantId });
      return res.status(400).json({ message: 'name is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if role with same name exists for this tenant
    const existing = await Role.findOne({ name, tenantId });
    if (existing) {
      logger.warn(`[${requestId}] Duplicate role name`, { tenantId, name });
      return res.status(409).json({ message: 'Role already exists for this tenant' });
    }
    
    const roleId = `role_${nanoid()}`;
    const doc = await Role.create({ roleId, name, description, tenantId });
    
    logger.info(`[${requestId}] Role created`, { tenantId, roleId, name });
    return res.status(201).json(doc);
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating role`, { tenantId, error: err.message });
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const getRoles = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // Include admin role (global) and tenant-specific roles only
    const query = {
      $or: [
        { tenantId: '-1' }, // Global roles (Admin, Editor, Designer)
        { tenantId } // User's own tenant roles
      ]
    };
    
    const docs = await Role.find(query).sort({ createdAt: -1 }).lean();
    
    logger.info(`[${requestId}] Roles retrieved`, { tenantId, count: docs.length });
    return res.json(docs);
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching roles`, { tenantId, error: err.message });
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { roleId } = req.params;
  const tenantId = req.user?.tenantId;

  try {
    const { name, description } = req.body;

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, roleId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const role = await Role.findOne({ roleId, tenantId });

    if (!role) {
      logger.warn(`[${requestId}] Role not found`, { tenantId, roleId });
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent updating global roles (Admin, Editor, Designer)
    if (role.tenantId === '-1') {
      logger.warn(`[${requestId}] Cannot update system role`, { tenantId, roleId });
      return res.status(403).json({ message: 'Cannot update system roles' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== role.name) {
      const existing = await Role.findOne({ name, tenantId, roleId: { $ne: roleId } });
      if (existing) {
        logger.warn(`[${requestId}] Duplicate role name`, { tenantId, roleId, name });
        return res.status(409).json({ message: 'Role with this name already exists' });
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    await role.save();

    logger.info(`[${requestId}] Role updated`, { tenantId, roleId });
    return res.status(200).json({
      message: 'Role updated successfully',
      role
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating role`, { tenantId, roleId, error: err.message });
    return res.status(500).json({ message: 'internal server error' });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { roleId } = req.params;
  const tenantId = req.user?.tenantId;

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`, { tenantId, roleId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const role = await Role.findOne({ roleId, tenantId });

    if (!role) {
      logger.warn(`[${requestId}] Role not found`, { tenantId, roleId });
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deleting global roles
    if (role.tenantId === '-1') {
      logger.warn(`[${requestId}] Cannot delete system role`, { tenantId, roleId });
      return res.status(403).json({ message: 'Cannot delete system roles' });
    }

    // Check if any users are assigned this role
    const User = require('../models/user').default;
    const usersWithRole = await User.countDocuments({ roleId, tenantId });
    
    if (usersWithRole > 0) {
      logger.warn(`[${requestId}] Role in use, cannot delete`, { tenantId, roleId, usersWithRole });
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }

    await Role.deleteOne({ roleId, tenantId });

    logger.info(`[${requestId}] Role deleted`, { tenantId, roleId });
    return res.status(200).json({
      message: 'Role deleted successfully'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting role`, { tenantId, roleId, error: err.message });
    return res.status(500).json({ message: 'internal server error' });
  }
};

export default { createRole, getRoles, updateRole, deleteRole };
