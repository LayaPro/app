import { Image } from '../models/image';
import { TenantSubscription } from '../models/tenantSubscription';
import { Tenant } from '../models/tenant';
import { S3Client, ListObjectsV2Command, _Object } from '@aws-sdk/client-s3';
import { getMainBucketName } from './s3Bucket';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Calculate total storage used by a tenant from AWS S3
 * @param tenantId - The tenant ID
 * @returns Total storage in GB
 */
export const calculateTenantStorageUsed = async (tenantId: string): Promise<number> => {
  try {
    // Get tenant's S3 folder name
    const tenant = await Tenant.findOne({ tenantId }).lean();
    if (!tenant?.s3TenantFolderName) {
      console.warn(`Tenant ${tenantId} has no S3 folder name`);
      return 0;
    }

    const bucketName = await getMainBucketName();
    const prefix = `${tenant.s3TenantFolderName}/`;
    
    let totalBytes = 0;
    let continuationToken: string | undefined;

    // List all objects in the tenant's folder
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        // Filter to only count original files (exclude compressed and thumbnails)
        const originalFiles = response.Contents.filter((obj: _Object) => {
          const key = obj.Key || '';
          return !key.includes('/compressed/') && !key.includes('/thumbnails/');
        });
        totalBytes += originalFiles.reduce((sum: number, obj: _Object) => sum + (obj.Size || 0), 0);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const totalGB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
    console.log(`[Storage] Tenant ${tenantId} (${tenant.s3TenantFolderName}): ${totalBytes} bytes = ${totalGB} GB`);
    return totalGB;
  } catch (error) {
    console.error(`Error calculating storage for tenant ${tenantId}:`, error);
    throw error;
  }
};

/**
 * Update the storage used for a tenant subscription
 * @param tenantId - The tenant ID
 * @returns Updated storage value in GB
 */
export const updateTenantStorageUsage = async (tenantId: string): Promise<number> => {
  try {
    const storageUsed = await calculateTenantStorageUsed(tenantId);
    
    // Update the tenant subscription record
    await TenantSubscription.findOneAndUpdate(
      { tenantId },
      { 
        storageUsed,
        lastStorageCalculatedAt: new Date(),
      },
      { upsert: false }
    );

    return storageUsed;
  } catch (error) {
    console.error(`Error updating storage for tenant ${tenantId}:`, error);
    throw error;
  }
};

/**
 * Get storage usage statistics for a tenant
 * @param tenantId - The tenant ID
 * @returns Storage statistics with used, limit, percentage, and remaining (all in GB)
 */
export const getTenantStorageStats = async (tenantId: string) => {
  try {
    const subscription = await TenantSubscription.findOne({ tenantId }).lean();
    
    if (!subscription) {
      return {
        storageUsedGB: 0,
        storageLimitGB: 0,
        percentageUsed: 0,
        remainingGB: 0,
        isNearLimit: false,
        isOverLimit: false,
      };
    }

    const percentageUsed = subscription.storageLimit > 0 
      ? Number(((subscription.storageUsed / subscription.storageLimit) * 100).toFixed(2))
      : 0;
    const remainingGB = Number(Math.max(0, subscription.storageLimit - subscription.storageUsed).toFixed(2));
    const isNearLimit = percentageUsed >= 80;
    const isOverLimit = percentageUsed >= 100;

    return {
      storageUsedGB: subscription.storageUsed,
      storageLimitGB: subscription.storageLimit,
      percentageUsed,
      remainingGB,
      isNearLimit,
      isOverLimit,
      lastCalculatedAt: subscription.lastStorageCalculatedAt,
    };
  } catch (error) {
    console.error(`Error getting storage stats for tenant ${tenantId}:`, error);
    throw error;
  }
};

/**
 * Check if tenant has enough storage for an upload
 * @param tenantId - The tenant ID
 * @param uploadSizeBytes - Size of the upload in bytes
 * @returns Boolean indicating if upload is allowed
 */
export const canUpload = async (tenantId: string, uploadSizeBytes: number): Promise<boolean> => {
  try {
    const subscription = await TenantSubscription.findOne({ tenantId }).lean();
    
    if (!subscription) {
      return false;
    }

    const uploadSizeGB = uploadSizeBytes / (1024 * 1024 * 1024);
    const wouldExceedLimit = (subscription.storageUsed + uploadSizeGB) > subscription.storageLimit;
    return !wouldExceedLimit;
  } catch (error) {
    console.error(`Error checking upload capacity for tenant ${tenantId}:`, error);
    return false;
  }
};
