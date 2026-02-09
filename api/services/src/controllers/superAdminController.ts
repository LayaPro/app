import { Request, Response } from 'express';
import Tenant from '../models/tenant';
import Project from '../models/project';
import Image from '../models/image';
import User from '../models/user';
import Role from '../models/role';
import Organization from '../models/organization';
import { SubscriptionPlan } from '../models/subscriptionPlan';
import { TenantSubscription } from '../models/tenantSubscription';
import { createTenantWithSubscription } from '../services/tenantService';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('SuperAdminController');

/**
 * Get all tenants with statistics
 * Note: Read operations are NOT audited - only logged for debugging
 */
export const getAllTenants = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Fetching all tenants with statistics`);

  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    logger.debug(`[${requestId}] Found ${tenants.length} tenants`);

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

    logger.info(`[${requestId}] Tenants retrieved successfully`, {
      count: tenantsWithStats.length,
      activeTenants: tenantsWithStats.filter(t => t.isActive).length
    });

    return res.json(tenantsWithStats);
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to fetch tenants`, {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Failed to fetch tenants' });
  }
};

/**
 * Get single tenant details
 * Note: Read operations are NOT audited - only logged for debugging
 */
export const getTenantById = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;

  logger.info(`[${requestId}] Fetching tenant details`, { tenantId });

  try {
    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    logger.debug(`[${requestId}] Fetching tenant statistics`, { tenantId });

    const projectCount = await Project.countDocuments({ tenantId: tenant.tenantId });
    const images = await Image.find({ tenantId: tenant.tenantId });
    const storageUsed = images.reduce((total, img) => total + (img.fileSize || 0), 0);

    logger.info(`[${requestId}] Tenant details retrieved successfully`, {
      tenantId,
      tenantName: tenant.tenantCompanyName,
      projectCount,
      storageUsedBytes: storageUsed
    });

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
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to fetch tenant`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Failed to fetch tenant' });
  }
};

/**
 * Create new tenant
 */
export const createTenant = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Tenant creation request initiated by super admin`, {
    timestamp: new Date().toISOString()
  });

  try {
    const { name, contactPerson, email, phone, address, planCode } = req.body;

    logger.debug(`[${requestId}] Request payload received`, {
      name,
      email,
      planCode: planCode || 'FREE'
    });

    if (!name || !email) {
      logger.warn(`[${requestId}] Validation failed: Missing required fields`, {
        hasName: !!name,
        hasEmail: !!email
      });
      return res.status(400).json({ message: 'Tenant name and email are required' });
    }

    // Check if tenant with same email exists
    logger.debug(`[${requestId}] Checking for duplicate email`);
    const existingTenant = await Tenant.findOne({ tenantEmailAddress: email.toLowerCase() });
    
    if (existingTenant) {
      logger.warn(`[${requestId}] Tenant creation failed: Duplicate email`, {
        email,
        existingTenantId: existingTenant.tenantId
      });
      return res.status(409).json({ 
        message: 'A tenant with this email already exists',
        existingTenantId: existingTenant.tenantId 
      });
    }

    // Parse contact person name
    const nameParts = (contactPerson || name).split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const tenantId = nanoid(12);
    
    // Generate S3 folder name: guid_TENANTNAME
    const sanitizedCompanyName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const s3TenantFolderName = `${nanoid(10)}_${sanitizedCompanyName}`;

    logger.info(`[${requestId}] Creating tenant`, {
      tenantId,
      s3FolderName: s3TenantFolderName
    });

    const selectedPlanCode = planCode || 'FREE';

    // Create tenant with subscription using common service
    const { tenant: newTenant, plan: selectedPlan } = await createTenantWithSubscription({
      tenantId,
      firstName,
      lastName,
      companyName: name,
      email,
      countryCode: '+91',
      phoneNumber: phone || '',
      planCode: selectedPlanCode,
      trialDays: 365, // 1 year for super admin created tenants
      createdBy: 'super-admin',
    });

    logger.info(`[${requestId}] Tenant and subscription created successfully`, {
      tenantId,
      companyName: name,
      email,
      planCode: selectedPlanCode
    });

    // Find or create Admin role for the tenant
    logger.debug(`[${requestId}] Fetching or creating admin role`);
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      logger.info(`[${requestId}] Admin role not found, creating new role`);
      adminRole = new Role({
        roleId: nanoid(12),
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: ['all'],
        isActive: true,
      });
      await adminRole.save();
      logger.info(`[${requestId}] Admin role created`, { roleId: adminRole.roleId });
    } else {
      logger.debug(`[${requestId}] Using existing admin role`, { roleId: adminRole.roleId });
    }

    // Create admin user for the tenant with email as password
    const tempPassword = email.toLowerCase(); // Use email as initial password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tempPassword, salt);

    logger.debug(`[${requestId}] Creating admin user with email as initial password`);

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
    logger.info(`[${requestId}] Admin user created successfully`, {
      userId: adminUser.userId,
      email: adminUser.email,
      isActivated: false
    });

    // Create organization for the tenant
    logger.debug(`[${requestId}] Creating organization for tenant`);
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
    logger.info(`[${requestId}] Organization created`, { organizationId });

    logger.info(`[${requestId}] Tenant creation completed successfully`, {
      tenantId,
      adminUserId: adminUser.userId,
      organizationId,
      planCode: selectedPlan?.planCode || 'NONE'
    });

    // Audit log for tenant creation
    logAudit({
      action: auditEvents.TENANT_CREATED,
      entityType: 'Tenant',
      entityId: tenantId,
      tenantId: tenantId,
      performedBy: 'Super Admin',
      changes: {
        name: newTenant.tenantCompanyName,
        email: newTenant.tenantEmailAddress,
        phone: newTenant.tenantPhoneNumber,
        subscriptionPlan: selectedPlan?.planCode || 'NONE',
        adminUser: adminUser.email,
      },
      metadata: {
        organizationId,
        adminUserId: adminUser.userId,
        storageLimit: selectedPlan?.storageLimit,
      },
      ipAddress: req.ip,
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
  } catch (error: any) {
    logger.error(`[${requestId}] Tenant creation failed`, {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({ message: 'Failed to create tenant' });
  }
};

/**
 * Update tenant
 */
export const updateTenant = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;
  
  logger.info(`[${requestId}] Tenant update request initiated`, {
    tenantId,
    fieldsToUpdate: Object.keys(req.body)
  });

  try {
    const { phone, planCode } = req.body;

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found for update`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Update fields
    const updates: string[] = [];
    
    if (phone !== undefined) {
      tenant.tenantPhoneNumber = phone;
      updates.push('phone');
    }
    
    if (planCode !== undefined) {
      tenant.subscriptionPlan = planCode;
      updates.push('subscriptionPlan');
      
      // Also update the TenantSubscription if plan is being changed
      const selectedPlan = await SubscriptionPlan.findOne({ planCode });
      if (selectedPlan) {
        await TenantSubscription.findOneAndUpdate(
          { tenantId },
          {
            planId: selectedPlan.planId,
            storageLimit: selectedPlan.storageLimit,
            subscriptionStatus: 'ACTIVE',
            paymentStatus: selectedPlan.planCode === 'FREE' ? 'FREE' : 'PENDING',
          },
          { upsert: true }
        );
        logger.info(`[${requestId}] Subscription plan updated`, {
          tenantId,
          newPlanCode: planCode,
          storageLimit: selectedPlan.storageLimit
        });
      } else {
        logger.warn(`[${requestId}] Plan code not found in subscription plans`, {
          tenantId,
          requestedPlanCode: planCode
        });
      }
    }
    
    tenant.updatedBy = 'super-admin';

    await tenant.save();

    logger.info(`[${requestId}] Tenant updated successfully`, {
      tenantId,
      updatedFields: updates
    });

    // Audit log for tenant update
    const changes: any = {};
    if (phone !== undefined) {
      changes.phone = { after: phone };
    }
    if (planCode !== undefined) {
      changes.planCode = { after: planCode };
    }

    if (Object.keys(changes).length > 0) {
      logAudit({
        action: planCode !== undefined ? auditEvents.PLAN_UPGRADED : auditEvents.TENANT_UPDATED,
        entityType: 'Tenant',
        entityId: tenantId,
        tenantId,
        performedBy: 'Super Admin',
        changes,
        metadata: {
          tenantName: tenant.tenantCompanyName,
          tenantEmail: tenant.tenantEmailAddress,
        },
        ipAddress: req.ip,
      });
    }

    return res.json({
      message: 'Tenant updated successfully',
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.tenantCompanyName,
        email: tenant.tenantEmailAddress,
        phone: tenant.tenantPhoneNumber,
        plan: tenant.subscriptionPlan,
      },
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Tenant update failed`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Failed to update tenant' });
  }
};

/**
 * Activate/Deactivate tenant
 */
export const toggleTenantStatus = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;
  const { isActive } = req.body;
  
  logger.info(`[${requestId}] Tenant status toggle request`, {
    tenantId,
    newStatus: isActive ? 'ACTIVE' : 'INACTIVE'
  });

  try {
    if (typeof isActive !== 'boolean') {
      logger.warn(`[${requestId}] Invalid isActive value`, {
        tenantId,
        providedValue: isActive,
        expectedType: 'boolean'
      });
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found for status toggle`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const oldStatus = tenant.isActive;
    tenant.isActive = isActive;
    await tenant.save();

    logger.info(`[${requestId}] Tenant status toggled successfully`, {
      tenantId,
      tenantName: tenant.tenantCompanyName,
      oldStatus: oldStatus ? 'ACTIVE' : 'INACTIVE',
      newStatus: isActive ? 'ACTIVE' : 'INACTIVE'
    });

    // Audit log for status change
    logAudit({
      action: auditEvents.TENANT_STATUS_CHANGED,
      entityType: 'Tenant',
      entityId: tenantId,
      tenantId,
      performedBy: 'Super Admin',
      changes: {
        isActive: { before: oldStatus, after: isActive },
      },
      metadata: {
        tenantName: tenant.tenantCompanyName,
        tenantEmail: tenant.tenantEmailAddress,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: `Tenant ${isActive ? 'activated' : 'deactivated'} successfully`,
      tenant,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Tenant status toggle failed`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Failed to update tenant status' });
  }
};

/**
 * Delete tenant (soft delete by deactivating)
 */
export const deleteTenant = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;
  
  logger.warn(`[${requestId}] Tenant deletion request initiated`, {
    tenantId,
    timestamp: new Date().toISOString()
  });

  try {
    const tenant = await Tenant.findOne({ tenantId });

    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found for deletion`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant has any projects
    logger.debug(`[${requestId}] Checking for existing projects`, { tenantId });
    const projectCount = await Project.countDocuments({ tenantId });

    if (projectCount > 0) {
      logger.warn(`[${requestId}] Deletion blocked: Tenant has existing projects`, {
        tenantId,
        projectCount
      });
      return res.status(400).json({ 
        message: 'Cannot delete tenant with existing projects. Deactivate instead.',
        projectCount 
      });
    }

    // Soft delete by deactivating
    tenant.isActive = false;
    await tenant.save();

    logger.warn(`[${requestId}] Tenant soft deleted (deactivated)`, {
      tenantId,
      tenantName: tenant.tenantCompanyName,
      email: tenant.tenantEmailAddress
    });

    // Audit log for tenant deletion
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'Tenant',
      entityId: tenantId,
      tenantId,
      performedBy: 'Super Admin',
      changes: {
        isActive: { before: true, after: false },
        deletedAt: new Date().toISOString(),
      },
      metadata: {
        tenantName: tenant.tenantCompanyName,
        tenantEmail: tenant.tenantEmailAddress,
        projectCount,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: 'Tenant deactivated successfully',
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Tenant deletion failed`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Failed to delete tenant' });
  }
};
