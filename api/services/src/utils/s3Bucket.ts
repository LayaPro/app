import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (!s3Client) {
    console.log('[S3Client] Initializing with AWS credentials:', {
      region: process.env.AWS_REGION || 'us-east-1',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)
    });

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

/**
 * Generate a unique S3 bucket name from project name
 * Bucket names must be globally unique and follow AWS naming rules
 */
export const generateBucketName = (projectName: string, tenantId: string): string => {
  // Convert to lowercase, replace spaces and special chars with hyphens
  const sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30); // Keep it short

  // Add tenant prefix and random suffix for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  
  return `laya-${sanitized}-${timestamp}-${random}`;
};

/**
 * Check if bucket exists
 */
export const bucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    await getS3Client().send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Create S3 bucket with proper configuration
 */
export const createS3Bucket = async (bucketName: string): Promise<string> => {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    console.log(`[S3] Attempting to create bucket: ${bucketName} in region: ${region}`);

    // Create bucket
    const createParams: any = {
      Bucket: bucketName,
    };

    // For regions other than us-east-1, LocationConstraint is required
    if (region !== 'us-east-1') {
      createParams.CreateBucketConfiguration = {
        LocationConstraint: region,
      };
    }

    console.log('[S3] Sending CreateBucketCommand...');
    await getS3Client().send(new CreateBucketCommand(createParams));
    console.log('[S3] Bucket created successfully');

    // Configure CORS for browser uploads
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // Restrict this in production
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    console.log('[S3] Configuring CORS...');
    await getS3Client().send(new PutBucketCorsCommand(corsParams));
    console.log('[S3] CORS configured successfully');

    console.log(`✓ Created S3 bucket: ${bucketName}`);
    return bucketName;
  } catch (error) {
    console.error('[S3] Failed to create S3 bucket:', {
      bucketName,
      region: process.env.AWS_REGION,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    });
    throw new Error(`Failed to create S3 bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
