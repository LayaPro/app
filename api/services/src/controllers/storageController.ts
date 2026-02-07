import { Request, Response } from 'express';
import { TenantSubscription } from '../models/tenantSubscription';
import { SubscriptionPlan } from '../models/subscriptionPlan';
import { 
  calculateTenantStorageUsed, 
  updateTenantStorageUsage, 
  getTenantStorageStats,
  canUpload
} from '../utils/storageCalculator';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('StorageController');

/**
 * Get storage statistics for a tenant
 * GET /api/storage/stats/:tenantId
 */
export const getStorageStats = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;

  logger.info(`[${requestId}] Fetching storage stats`, { tenantId });

  try {

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in request`, { tenantId });
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Get subscription to include plan details
    const subscription = await TenantSubscription.findOne({ tenantId }).lean();
    
    if (!subscription) {
      logger.warn(`[${requestId}] No subscription found for tenant`, { tenantId });
      return res.status(404).json({ 
        error: 'No subscription found for this tenant',
        storageUsedGB: 0,
        storageLimitGB: 0,
        percentageUsed: 0,
        remainingGB: 0,
        isNearLimit: false,
        isOverLimit: false,
      });
    }

    // Get plan details
    const plan = await SubscriptionPlan.findOne({ planId: subscription.planId }).lean();

    // Get storage stats
    const stats = await getTenantStorageStats(tenantId);

    logger.info(`[${requestId}] Storage stats retrieved successfully`, {
      tenantId,
      storageUsedGB: stats.storageUsedGB,
      storageLimitGB: stats.storageLimitGB,
      percentageUsed: stats.percentageUsed
    });

    res.json({
      ...stats,
      planName: plan?.planName || 'Unknown',
      planCode: plan?.planCode,
      subscriptionStatus: subscription.subscriptionStatus,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching storage stats`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch storage statistics' });
  }
};

/**
 * Refresh storage calculation for a tenant
 * POST /api/storage/refresh/:tenantId
 */
export const refreshStorageUsage = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;

  logger.info(`[${requestId}] Refreshing storage usage`, { tenantId });

  try {

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in request`, { tenantId });
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const storageUsed = await updateTenantStorageUsage(tenantId);
    const stats = await getTenantStorageStats(tenantId);

    logger.info(`[${requestId}] Storage usage refreshed successfully`, {
      tenantId,
      storageUsedGB: stats.storageUsedGB,
      storageLimitGB: stats.storageLimitGB
    });

    res.json({
      message: 'Storage usage refreshed successfully',
      ...stats,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error refreshing storage usage`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to refresh storage usage' });
  }
};

/**
 * Check if tenant can upload files of given size
 * POST /api/storage/check-upload
 */
export const checkUploadCapacity = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId, uploadSizeBytes } = req.body;

  logger.info(`[${requestId}] Checking upload capacity`, {
    tenantId,
    uploadSizeBytes
  });

  try {

    if (!tenantId || !uploadSizeBytes) {
      logger.warn(`[${requestId}] Missing required fields`, {
        tenantId,
        hasUploadSize: !!uploadSizeBytes
      });
      return res.status(400).json({ error: 'Tenant ID and upload size are required' });
    }

    const canUploadFiles = await canUpload(tenantId, uploadSizeBytes);
    const stats = await getTenantStorageStats(tenantId);

    logger.info(`[${requestId}] Upload capacity checked`, {
      tenantId,
      uploadSizeBytes,
      canUpload: canUploadFiles,
      percentageUsed: stats.percentageUsed
    });

    res.json({
      canUpload: canUploadFiles,
      ...stats,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error checking upload capacity`, {
      tenantId: req.body.tenantId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to check upload capacity' });
  }
};

/**
 * Get all subscription plans
 * GET /api/storage/plans
 */
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const requestId = nanoid(8);

  logger.info(`[${requestId}] Fetching subscription plans`);

  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    logger.info(`[${requestId}] Subscription plans retrieved successfully`, {
      count: plans.length
    });

    res.json(plans);
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching subscription plans`, {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

/**
 * Update tenant subscription plan
 * PUT /api/storage/subscription/:tenantId
 */
export const updateTenantSubscription = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;
  const { planId } = req.body;

  logger.info(`[${requestId}] Updating tenant subscription`, {
    tenantId,
    planId
  });

  try {

    if (!tenantId || !planId) {
      logger.warn(`[${requestId}] Missing required fields`, {
        tenantId,
        hasPlanId: !!planId
      });
      return res.status(400).json({ error: 'Tenant ID and Plan ID are required' });
    }

    // Get current subscription for audit trail
    const currentSubscription = await TenantSubscription.findOne({ tenantId }).lean();

    // Get the new plan details
    const plan = await SubscriptionPlan.findOne({ planId }).lean();
    
    if (!plan) {
      logger.warn(`[${requestId}] Plan not found`, { planId, tenantId });
      return res.status(404).json({ error: 'Plan not found' });
    }

    logger.debug(`[${requestId}] Updating subscription to plan`, {
      tenantId,
      planId,
      planCode: plan.planCode,
      planName: plan.planName,
      storageLimit: plan.storageLimit
    });

    // Update or create subscription
    const subscription = await TenantSubscription.findOneAndUpdate(
      { tenantId },
      {
        planId: plan.planId,
        storageLimit: plan.storageLimit,
        subscriptionStatus: 'ACTIVE',
        paymentStatus: plan.price === 0 ? 'FREE' : 'PENDING',
      },
      { upsert: true, new: true }
    );

    logger.info(`[${requestId}] Subscription updated successfully`, {
      tenantId,
      oldPlanId: currentSubscription?.planId,
      newPlanId: plan.planId,
      planCode: plan.planCode,
      storageLimit: plan.storageLimit
    });

    // Audit log for subscription change
    logAudit({
      action: currentSubscription?.planId !== plan.planId ? auditEvents.PLAN_UPGRADED : auditEvents.TENANT_UPDATED,
      entityType: 'TenantSubscription',
      entityId: subscription._id.toString(),
      tenantId,
      performedBy: (req as any).user?.userId || 'System',
      changes: {
        planId: {
          before: currentSubscription?.planId,
          after: plan.planId
        },
        planCode: plan.planCode,
        storageLimit: {
          before: currentSubscription?.storageLimit,
          after: plan.storageLimit
        }
      },
      metadata: {
        planName: plan.planName,
        price: plan.price,
        paymentStatus: subscription.paymentStatus
      },
      ipAddress: req.ip
    });

    res.json({
      message: 'Subscription updated successfully',
      subscription,
      plan,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating subscription`, {
      tenantId,
      planId: req.body.planId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};
