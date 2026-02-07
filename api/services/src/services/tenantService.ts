import { nanoid } from 'nanoid';
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

  // Generate unique identifiers
  const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const s3TenantFolderName = `${nanoid(10)}_${sanitizedName}`;
  const tenantUsername = email.split('@')[0].toLowerCase() + '_' + nanoid(6);

  // Set subscription dates
  const subscriptionStartDate = new Date();
  const subscriptionEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  // Create tenant
  const tenant = await Tenant.create({
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
  });

  logger.info('Tenant created', { 
    tenantId: tenant.tenantId, 
    companyName,
    createdBy 
  });

  // Create TenantSubscription record
  const plan = await SubscriptionPlan.findOne({ planCode });
  
  if (!plan) {
    logger.error('Subscription plan not found', { planCode });
    throw new Error(`Subscription plan ${planCode} not found`);
  }

  await TenantSubscription.create({
    tenantId: tenant.tenantId,
    planId: plan.planId,
    storageUsed: 0,
    storageLimit: plan.storageLimit,
    subscriptionStatus: 'ACTIVE',
    paymentStatus: plan.planCode === 'FREE' ? 'FREE' : 'PENDING',
    startDate: subscriptionStartDate,
    endDate: subscriptionEndDate,
    isAutoRenewal: false,
  });

  logger.info('TenantSubscription created', { 
    tenantId: tenant.tenantId, 
    planCode: plan.planCode,
    storageLimit: plan.storageLimit
  });

  return {
    tenant,
    plan,
  };
};
