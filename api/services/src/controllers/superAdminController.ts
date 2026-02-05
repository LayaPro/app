import { Request, Response } from 'express';
import Tenant from '../models/tenant';
import Project from '../models/project';
import Image from '../models/image';
import User from '../models/user';
import Role from '../models/role';
import Organization from '../models/organization';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { ensureMainBucketExists } from '../utils/s3Bucket';

/**
 * Get all tenants with statistics
 */
export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    // Fetch statistics for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const projectCount = await Project.countDocuments({ tenantId: tenant.tenantId });
        
        // Calculate total storage used by images
        const images = await Image.find({ tenantId: tenant.tenantId });
        const storageUsed = images.reduce((total, img) => total + (img.fileSize || 0), 0);

        return {
          tenantId: tenant.tenantId,
          name: tenant.tenantCompanyName || `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
          contactPerson: `${tenant.tenantFirstName} ${tenant.tenantLastName}`.trim(),
          email: tenant.tenantEmailAddress,
          phone: tenant.tenantPhoneNumber,
          address: '', // Not in current model
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          stats: {
            projectCount,
            storageUsed, // in bytes
          },
        };
      })
    );

    return res.json(tenantsWithStats);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return res.status(500).json({ message: 'Failed to fetch tenants' });
  }
};

/**
 * Get single tenant details
 */
export const getTenantById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const projectCount = await Project.countDocuments({ tenantId: tenant.tenantId });
    const images = await Image.find({ tenantId: tenant.tenantId });
    const storageUsed = images.reduce((total, img) => total + (img.fileSize || 0), 0);

    return res.json({
      tenantId: tenant.tenantId,
      name: tenant.tenantCompanyName || `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
      contactPerson: `${tenant.tenantFirstName} ${tenant.tenantLastName}`.trim(),
      email: tenant.tenantEmailAddress,
      phone: tenant.tenantPhoneNumber,
      address: '',
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      stats: {
        projectCount,
        storageUsed,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return res.status(500).json({ message: 'Failed to fetch tenant' });
  }
};

/**
 * Create new tenant
 */
export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Tenant name and email are required' });
    }

    // Ensure main S3 bucket exists (creates if first tenant)
    try {
      await ensureMainBucketExists();
    } catch (s3Error) {
      console.error('[Super Admin] Failed to ensure S3 bucket exists:', s3Error);
      return res.status(500).json({ 
        message: 'Failed to initialize storage bucket. Please check AWS configuration.' 
      });
    }

    // Check if tenant with same email exists
    const existingTenant = await Tenant.findOne({ tenantEmailAddress: email.toLowerCase() });
    
    if (existingTenant) {
      console.log('[Super Admin] Tenant with email already exists:', existingTenant.tenantId);
      return res.status(409).json({ 
        message: 'A tenant with this email already exists',
        existingTenantId: existingTenant.tenantId 
      });
    }

    // Parse contact person name
    const nameParts = (contactPerson || name).split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate username from email
    const username = email.split('@')[0] + '_' + nanoid(4);
    const tenantId = nanoid(12);
    
    // Generate S3 folder name: guid_TENANTNAME
    const sanitizedCompanyName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const s3TenantFolderName = `${nanoid(10)}_${sanitizedCompanyName}`;

    const newTenant = new Tenant({
      tenantId,
      tenantFirstName: firstName,
      tenantLastName: lastName,
      tenantCompanyName: name,
      tenantUsername: username,
      tenantEmailAddress: email.toLowerCase(),
      countryCode: '+1',
      tenantPhoneNumber: phone || '',
      isActive: true,
      subscriptionPlan: 'basic',
      s3TenantFolderName,
      createdBy: 'super-admin',
      updatedBy: 'super-admin',
    });

    await newTenant.save();

    // Find or create Admin role for the tenant
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = new Role({
        roleId: nanoid(12),
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: ['all'],
        isActive: true,
      });
      await adminRole.save();
    }

    // Create admin user for the tenant with email as password
    const tempPassword = email.toLowerCase(); // Use email as initial password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tempPassword, salt);

    const adminUser = new User({
      tenantId,
      userId: nanoid(12),
      email: email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      firstName,
      lastName,
      roleId: adminRole.roleId,
      isActive: true,
      isActivated: false, // Mark as not activated so they must set password
      isSuperAdmin: false,
      tokenVersion: 0,
    });

    await adminUser.save();

    // Create organization for the tenant
    const organizationId = `org_${nanoid()}`;
    await Organization.create({
      organizationId,
      tenantId,
      companyName: newTenant.tenantCompanyName,
      email: newTenant.tenantEmailAddress,
      countryCode: newTenant.countryCode,
      phone: newTenant.tenantPhoneNumber,
      createdBy: adminUser.userId,
      updatedBy: adminUser.userId
    });

    return res.status(201).json({
      message: 'Tenant created successfully. Login with email as password, then set new password.',
      tenant: {
        tenantId: newTenant.tenantId,
        name: newTenant.tenantCompanyName,
        email: newTenant.tenantEmailAddress,
      },
      user: {
        userId: adminUser.userId,
        email: adminUser.email,
        tempPassword: tempPassword, // Return for reference
      },
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({ message: 'Failed to create tenant' });
  }
};

/**
 * Update tenant
 */
export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { name, contactPerson, email, phone } = req.body;

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if new email conflicts with another tenant
    if (email && email !== tenant.tenantEmailAddress) {
      const existingTenant = await Tenant.findOne({ 
        tenantEmailAddress: email.toLowerCase(), 
        tenantId: { $ne: tenantId } 
      });
      if (existingTenant) {
        return res.status(409).json({ message: 'Tenant with this email already exists' });
      }
    }

    // Update fields
    if (name) tenant.tenantCompanyName = name;
    if (contactPerson) {
      const nameParts = contactPerson.split(' ');
      tenant.tenantFirstName = nameParts[0] || '';
      tenant.tenantLastName = nameParts.slice(1).join(' ') || '';
    }
    if (email !== undefined) tenant.tenantEmailAddress = email.toLowerCase();
    if (phone !== undefined) tenant.tenantPhoneNumber = phone;
    tenant.updatedBy = 'super-admin';

    await tenant.save();

    return res.json({
      message: 'Tenant updated successfully',
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.tenantCompanyName,
        email: tenant.tenantEmailAddress,
      },
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return res.status(500).json({ message: 'Failed to update tenant' });
  }
};

/**
 * Activate/Deactivate tenant
 */
export const toggleTenantStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.isActive = isActive;
    await tenant.save();

    return res.json({
      message: `Tenant ${isActive ? 'activated' : 'deactivated'} successfully`,
      tenant,
    });
  } catch (error) {
    console.error('Error toggling tenant status:', error);
    return res.status(500).json({ message: 'Failed to update tenant status' });
  }
};

/**
 * Delete tenant (soft delete by deactivating)
 */
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant has any projects
    const projectCount = await Project.countDocuments({ tenantId });

    if (projectCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tenant with existing projects. Deactivate instead.',
        projectCount 
      });
    }

    // Soft delete by deactivating
    tenant.isActive = false;
    await tenant.save();

    return res.json({
      message: 'Tenant deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return res.status(500).json({ message: 'Failed to delete tenant' });
  }
};
