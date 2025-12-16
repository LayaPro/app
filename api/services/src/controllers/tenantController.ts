import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import Tenant from '../models/tenant';
import User from '../models/user';
import Role from '../models/role';
import { AuthenticatedRequest } from '../middleware/auth';
import { Tenant as BaseTenant } from 'laya-shared';

interface CreateTenantRequest extends BaseTenant {
  adminRoleId?: string; // Optional, defaults to 'admin' role
}

interface UpdateTenantRequest extends Partial<BaseTenant> {
  // All fields are optional for updates
}



export const createTenant = async (req: AuthenticatedRequest, res: Response) => {
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
      subscriptionEndDate,
      adminRoleId
    }: CreateTenantRequest = req.body;

    // Validate required fields
    if (!tenantFirstName || !tenantLastName || !tenantUsername || !tenantEmailAddress || !subscriptionPlan) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: tenantFirstName, tenantLastName, tenantUsername, tenantEmailAddress, subscriptionPlan'
      });
    }



    // Check if tenant username or email already exists
    const existingTenant = await Tenant.findOne({
      $or: [
        { tenantUsername: tenantUsername.toLowerCase() },
        { tenantEmailAddress: tenantEmailAddress.toLowerCase() }
      ]
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant with this username or email already exists'
      });
    }

    // Get admin role (default to 'admin' if not specified)
    let adminRole;
    if (adminRoleId) {
      adminRole = await Role.findById(adminRoleId);
      if (!adminRole) {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin role specified'
        });
      }
    } else {
      // Find the 'admin' role by name
      adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        return res.status(400).json({
          success: false,
          message: 'Default admin role not found in database'
        });
      }
    }

    // Create tenant
    const newTenantId = nanoid();
    const newTenant = new Tenant({
      tenantId: newTenantId,
      tenantFirstName: tenantFirstName.trim(),
      tenantLastName: tenantLastName.trim(),
      tenantCompanyName: tenantCompanyName?.trim() || '',
      tenantUsername: tenantUsername.toLowerCase().trim(),
      tenantEmailAddress: tenantEmailAddress.toLowerCase().trim(),
      countryCode,
      tenantPhoneNumber,
      subscriptionPlan,
      subscriptionStartDate: subscriptionStartDate || new Date(),
      subscriptionEndDate,
      isActive: true,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });

    await newTenant.save();

    // Create admin user for the tenant using tenant details
    const userCreationResult = await createTenantAdminUser({
      tenantId: newTenantId,
      email: tenantEmailAddress,
      firstName: tenantFirstName,
      lastName: tenantLastName,
      roleId: adminRole._id
    });

    if (!userCreationResult.success) {
      // If user creation fails, delete the tenant to maintain consistency
      await Tenant.findByIdAndDelete(newTenant._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create admin user for tenant',
        error: userCreationResult.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tenant and admin user created successfully',
      tenant: {
        tenantId: newTenant.tenantId,
        tenantFirstName: newTenant.tenantFirstName,
        tenantLastName: newTenant.tenantLastName,
        tenantCompanyName: newTenant.tenantCompanyName,
        tenantUsername: newTenant.tenantUsername,
        tenantEmailAddress: newTenant.tenantEmailAddress,
        subscriptionPlan: newTenant.subscriptionPlan,
        isActive: newTenant.isActive,
        createdAt: newTenant.createdAt
      },
      adminUser: userCreationResult.user,
      temporaryPassword: userCreationResult.temporaryPassword
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllTenants = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Additional validation: Only superadmin users can view all tenants
    if (!req.user || req.user.roleName !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superadmin users can view all tenants.'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { tenantFirstName: { $regex: search, $options: 'i' } },
        { tenantLastName: { $regex: search, $options: 'i' } },
        { tenantCompanyName: { $regex: search, $options: 'i' } },
        { tenantUsername: { $regex: search, $options: 'i' } },
        { tenantEmailAddress: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [tenants, totalCount] = await Promise.all([
      Tenant.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tenant.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTenantById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const tenant = await Tenant.findOne({ tenantId }).select('-__v').lean();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      tenant
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateTenant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const updateData: UpdateTenantRequest = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if username or email conflicts with other tenants
    if (updateData.tenantUsername || updateData.tenantEmailAddress) {
      const conflictFilter: any = {
        tenantId: { $ne: tenantId }
      };

      const conflictChecks = [];
      if (updateData.tenantUsername) {
        conflictChecks.push({ tenantUsername: updateData.tenantUsername.toLowerCase() });
      }
      if (updateData.tenantEmailAddress) {
        conflictChecks.push({ tenantEmailAddress: updateData.tenantEmailAddress.toLowerCase() });
      }

      if (conflictChecks.length > 0) {
        conflictFilter.$or = conflictChecks;
        const existingTenant = await Tenant.findOne(conflictFilter);
        
        if (existingTenant) {
          return res.status(400).json({
            success: false,
            message: 'Tenant with this username or email already exists'
          });
        }
      }
    }

    // Prepare update object
    const updateObject: any = {
      ...updateData,
      updatedBy: req.user?.userId
    };

    // Normalize strings
    if (updateData.tenantFirstName) updateObject.tenantFirstName = updateData.tenantFirstName.trim();
    if (updateData.tenantLastName) updateObject.tenantLastName = updateData.tenantLastName.trim();
    if (updateData.tenantCompanyName) updateObject.tenantCompanyName = updateData.tenantCompanyName.trim();
    if (updateData.tenantUsername) updateObject.tenantUsername = updateData.tenantUsername.toLowerCase().trim();
    if (updateData.tenantEmailAddress) updateObject.tenantEmailAddress = updateData.tenantEmailAddress.toLowerCase().trim();

    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId },
      updateObject,
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteTenant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if tenant has any superadmin users
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    if (superadminRole) {
      const hasSuperadmin = await User.findOne({
        tenantId: tenantId,
        roleId: superadminRole._id,
        isActive: true
      });

      if (hasSuperadmin) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete tenant with active superadmin users'
        });
      }
    }

    // Check if there are active users in this tenant
    const activeUsersCount = await User.countDocuments({
      tenantId: tenantId,
      isActive: true
    });

    if (activeUsersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete tenant with ${activeUsersCount} active users. Deactivate users first or use soft delete.`
      });
    }

    // Hard delete tenant and all associated users
    await Promise.all([
      Tenant.findOneAndDelete({ tenantId }),
      User.deleteMany({ tenantId })
    ]);

    res.status(200).json({
      success: true,
      message: 'Tenant and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deactivateTenant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Deactivate tenant and all users
    await Promise.all([
      Tenant.findOneAndUpdate(
        { tenantId },
        { 
          isActive: false, 
          updatedBy: req.user?.userId 
        }
      ),
      User.updateMany(
        { tenantId },
        { isActive: false }
      )
    ]);

    res.status(200).json({
      success: true,
      message: 'Tenant and all associated users deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to create admin user for tenant
const createTenantAdminUser = async (userData: {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}): Promise<{ success: boolean; user?: any; temporaryPassword?: string; error?: string }> => {
  try {
    // Generate temporary password and hash it
    const temporaryPassword = nanoid(12);
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Create new user
    const newUser = new User({
      tenantId: userData.tenantId,
      userId: nanoid(),
      email: userData.email.toLowerCase(),
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roleId: userData.roleId,
      isActive: true,
      isPasswordSet: false,
      temporaryPassword
    });

    await newUser.save();

    // Get role information for response
    const role = await Role.findById(userData.roleId);

    return {
      success: true,
      user: {
        userId: newUser.userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roleId: newUser.roleId,
        roleName: role?.name,
        tenantId: newUser.tenantId,
        isPasswordSet: newUser.isPasswordSet
      },
      temporaryPassword
    };
  } catch (error) {
    console.error('Create tenant admin user error:', error);
    return {
      success: false,
      error: 'Failed to create admin user'
    };
  }
};