import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import { SubscriptionPlan } from '../models/subscriptionPlan';
import { TenantSubscription } from '../models/tenantSubscription';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('TenantService');

interface CreateTenantWithSubscriptionParams {
  tenantId: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  planCode?: string;
  trialDays?: number;
  createdBy: string;
}

/**
 * Creates a tenant record with associated subscription
 * Handles tenant creation, S3 folder naming, and subscription initialization
 * Uses MongoDB transactions to ensure atomicity (all-or-nothing)
 */
export const createTenantWithSubscription = async (params: CreateTenantWithSubscriptionParams) => {
  const {
    tenantId,
    firstName,
    lastName,
    companyName,
    email,
    countryCode = '+91',
    phoneNumber = '',
    planCode = 'FREE',
    trialDays = 14,
    createdBy,
  } = params;

  const Tenant = require('../models/tenant').default;
  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Generate unique identifiers
    const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const s3TenantFolderName = `${nanoid(10)}_${sanitizedName}`;
    const tenantUsername = email.split('@')[0].toLowerCase() + '_' + nanoid(6);

    // Set subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    // Create tenant within transaction
    const [tenant] = await Tenant.create([{
      tenantId,
      tenantFirstName: firstName,
      tenantLastName: lastName,
      tenantCompanyName: companyName,
      tenantUsername,
      tenantEmailAddress: email.toLowerCase(),
      countryCode,
      tenantPhoneNumber: phoneNumber,
      isActive: true,
      subscriptionPlan: planCode,
      subscriptionStartDate,
      subscriptionEndDate,
      s3TenantFolderName,
      createdBy,
      updatedBy: createdBy,
    }], { session });

    logger.info('Tenant created in transaction', { 
      tenantId: tenant.tenantId, 
      companyName,
      createdBy 
    });

    // Get subscription plan
    const plan = await SubscriptionPlan.findOne({ planCode }).session(session);
    
    if (!plan) {
      throw new Error(`Subscription plan ${planCode} not found`);
    }

    // Create TenantSubscription within transaction
    await TenantSubscription.create([{
      tenantId: tenant.tenantId,
      planId: plan.planId,
      storageUsed: 0,
      storageLimit: plan.storageLimit,
      subscriptionStatus: 'ACTIVE',
      paymentStatus: plan.planCode === 'FREE' ? 'FREE' : 'PENDING',
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      isAutoRenewal: false,
    }], { session });

    logger.info('TenantSubscription created in transaction', { 
      tenantId: tenant.tenantId, 
      planCode: plan.planCode,
      storageLimit: plan.storageLimit
    });

    // Commit transaction
    await session.commitTransaction();

    logger.info('Transaction committed successfully', { tenantId: tenant.tenantId });

    return {
      tenant,
      plan,
    };
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    
    logger.error('Transaction aborted', { 
      email, 
      error: error.message,
      code: error.code 
    });

    // Handle duplicate key error
    if (error.code === 11000) {
      throw new Error('An account with this email already exists');
    }

    throw error;
  } finally {
    session.endSession();
  }
};
