import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // Enable transfer acceleration if configured
      ...(process.env.AWS_S3_USE_ACCELERATE_ENDPOINT === 'true' && {
        useAccelerateEndpoint: true,
      }),
    });
  }
  return s3Client;
};

export interface UploadToS3Params {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder: string;
  storageClass?: 'STANDARD' | 'GLACIER_IR';
  bucketName?: string; // Optional: use specific bucket, otherwise use default
  folderPrefix?: string; // Optional: prefix for folder (e.g., event name)
}

export const uploadToS3 = async ({
  buffer,
  fileName,
  mimeType,
  folder,
  storageClass = 'STANDARD',
  bucketName,
  folderPrefix,
}: UploadToS3Params): Promise<string> => {
  const bucket = bucketName || process.env.AWS_S3_BUCKET!;
  const fullFolder = folderPrefix ? `${folderPrefix}/${folder}` : folder;
  
  // Keep original filename but add unique prefix to prevent collisions
  // Format: folder/original-filename.ext (use nanoid only if duplicate)
  const key = `${fullFolder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    StorageClass: storageClass,
  });

  await getS3Client().send(command);

  // Return the URL
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export const uploadBothVersions = async (
  originalBuffer: Buffer,
  compressedBuffer: Buffer,
  fileName: string,
  mimeType: string,
  bucketName?: string,
  folderPrefix?: string
): Promise<{ originalUrl: string; compressedUrl: string }> => {
  const [originalUrl, compressedUrl] = await Promise.all([
    uploadToS3({
      buffer: originalBuffer,
      fileName: fileName,
      mimeType,
      folder: 'originals',
      storageClass: 'GLACIER_IR',
      bucketName,
      folderPrefix,
    }),
    uploadToS3({
      buffer: compressedBuffer,
      fileName: fileName,
      mimeType,
      folder: 'compressed',
      storageClass: 'STANDARD',
      bucketName,
      folderPrefix,
    }),
  ]);

  return { originalUrl, compressedUrl };
};
