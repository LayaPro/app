import { Response } from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import Tenant from '../models/tenant';
import User from '../models/user';
import Role from '../models/role';
import { AuthRequest } from '../middleware/auth';

export const createTenant = async (req: AuthRequest, res: Response) => {
  try {
    const {
      tenantFirstName,
      tenantLastName,
      tenantCompanyName,
      tenantUsername,
      tenantEmailAddress,
      countryCode,
      tenantPhoneNumber,
      subscriptionPlan,
      subscriptionStartDate,
      subscriptionEndDate
    } = req.body;

    // Validate required fields
    if (!tenantUsername || !tenantEmailAddress) {
      return res.status(400).json({ message: 'Tenant username and email are required' });
    }

    if (!tenantFirstName || !tenantLastName) {
      return res.status(400).json({ message: 'Tenant first name and last name are required' });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({
      $or: [{ tenantUsername }, { tenantEmailAddress }]
    });

    if (existingTenant) {
      return res.status(409).json({ message: 'Tenant with this username or email already exists' });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: tenantEmailAddress.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Get or create global admin role
    let adminRole = await Role.findOne({ name: 'admin', tenantId: '-1' });
    if (!adminRole) {
      const roleId = `role_${nanoid()}`;
      adminRole = await Role.create({
        roleId,
        tenantId: '-1', // Global role
        name: 'admin',
        description: 'Tenant administrator with full access to tenant data'
      });
    }

    // Create new tenant
    const tenantId = `tenant_${nanoid()}`;
    const tenant = await Tenant.create({
      tenantId,
      tenantFirstName,
      tenantLastName,
      tenantCompanyName,
      tenantUsername,
      tenantEmailAddress,
      countryCode,
      tenantPhoneNumber,
      subscriptionPlan,
      subscriptionStartDate,
      subscriptionEndDate,
      isActive: true,
      createdBy: req.user?.userId
    });

    // Generate random password for admin user (12 characters)
    const generatedPassword = nanoid(12);
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Create admin user for the tenant using tenant details
    const userId = `user_${nanoid()}`;
    const adminUser = await User.create({
      userId,
      tenantId: tenant.tenantId,
      email: tenantEmailAddress.toLowerCase(),
      passwordHash,
      firstName: tenantFirstName,
      lastName: tenantLastName,
      roleId: adminRole.roleId,
      isActive: true
    });

    return res.status(201).json({
      message: 'Tenant and admin user created successfully',
      tenant: {
        tenantId: tenant.tenantId,
        tenantUsername: tenant.tenantUsername,
        tenantEmailAddress: tenant.tenantEmailAddress,
        tenantCompanyName: tenant.tenantCompanyName,
        isActive: tenant.isActive
      },
      adminUser: {
        userId: adminUser.userId,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        roleId: adminUser.roleId,
        tempPassword: generatedPassword // Send this via email later, remove from response in production
      }
    });
  } catch (err: any) {
    console.error('Create tenant error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTenants = async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      message: 'Tenants retrieved successfully',
      count: tenants.length,
      tenants
    });
  } catch (err: any) {
    console.error('Get all tenants error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTenantById = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    // Check authorization: admin can access any tenant, others can only access their own
    if (req.user?.roleName !== 'Admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant details.' });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    return res.status(200).json({ tenant });
  } catch (err: any) {
    console.error('Get tenant error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTenant = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    // Don't allow updating tenantId
    delete updates.tenantId;
    
    // Add updated by info
    updates.updatedBy = req.user?.userId;

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    return res.status(200).json({
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (err: any) {
    console.error('Update tenant error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTenant = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Delete all users associated with this tenant
    const deleteResult = await User.deleteMany({ tenantId });

    // Delete the tenant
    await Tenant.deleteOne({ tenantId });

    return res.status(200).json({
      message: 'Tenant and associated users deleted successfully',
      tenantId,
      deletedUsersCount: deleteResult.deletedCount
    });
  } catch (err: any) {
    console.error('Delete tenant error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleTenantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { isActive, updatedBy: req.user?.userId } },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    return res.status(200).json({
      message: `Tenant ${isActive ? 'activated' : 'deactivated'} successfully`,
      tenant
    });
  } catch (err: any) {
    console.error('Toggle tenant status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  toggleTenantStatus
};
