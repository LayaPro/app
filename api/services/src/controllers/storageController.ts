import { Request, Response } from 'express';
import { TenantSubscription } from '../models/tenantSubscription';
import { SubscriptionPlan } from '../models/subscriptionPlan';
import { 
  calculateTenantStorageUsed, 
  updateTenantStorageUsage, 
  getTenantStorageStats,
  canUpload
} from '../utils/storageCalculator';

/**
 * Get storage statistics for a tenant
 * GET /api/storage/stats/:tenantId
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Get subscription to include plan details
    const subscription = await TenantSubscription.findOne({ tenantId }).lean();
    
    if (!subscription) {
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

    res.json({
      ...stats,
      planName: plan?.planName || 'Unknown',
      planCode: plan?.planCode,
      subscriptionStatus: subscription.subscriptionStatus,
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    res.status(500).json({ error: 'Failed to fetch storage statistics' });
  }
};

/**
 * Refresh storage calculation for a tenant
 * POST /api/storage/refresh/:tenantId
 */
export const refreshStorageUsage = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const storageUsed = await updateTenantStorageUsage(tenantId);
    const stats = await getTenantStorageStats(tenantId);

    res.json({
      message: 'Storage usage refreshed successfully',
      ...stats,
    });
  } catch (error) {
    console.error('Error refreshing storage usage:', error);
    res.status(500).json({ error: 'Failed to refresh storage usage' });
  }
};

/**
 * Check if tenant can upload files of given size
 * POST /api/storage/check-upload
 */
export const checkUploadCapacity = async (req: Request, res: Response) => {
  try {
    const { tenantId, uploadSizeBytes } = req.body;

    if (!tenantId || !uploadSizeBytes) {
      return res.status(400).json({ error: 'Tenant ID and upload size are required' });
    }

    const canUploadFiles = await canUpload(tenantId, uploadSizeBytes);
    const stats = await getTenantStorageStats(tenantId);

    res.json({
      canUpload: canUploadFiles,
      ...stats,
    });
  } catch (error) {
    console.error('Error checking upload capacity:', error);
    res.status(500).json({ error: 'Failed to check upload capacity' });
  }
};

/**
 * Get all subscription plans
 * GET /api/storage/plans
 */
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

/**
 * Update tenant subscription plan
 * PUT /api/storage/subscription/:tenantId
 */
export const updateTenantSubscription = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { planId } = req.body;

    if (!tenantId || !planId) {
      return res.status(400).json({ error: 'Tenant ID and Plan ID are required' });
    }

    // Get the new plan details
    const plan = await SubscriptionPlan.findOne({ planId }).lean();
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

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

    res.json({
      message: 'Subscription updated successfully',
      subscription,
      plan,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};
