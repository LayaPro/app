import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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

interface ParsedS3Url {
  bucket: string;
  region: string;
  key: string;
}

interface ReadableStreamLike {
  getReader: () => {
    read: () => Promise<{ done: boolean; value?: Uint8Array }>;
    releaseLock?: () => void;
  };
}

interface BlobLike {
  arrayBuffer: () => Promise<ArrayBuffer>;
  stream?: () => ReadableStreamLike;
  type?: string;
}

const isNodeReadable = (stream: unknown): stream is Readable => {
  return stream instanceof Readable || (
    typeof stream === 'object' &&
    stream !== null &&
    typeof (stream as any).pipe === 'function' &&
    typeof (stream as any).read === 'function'
  );
};

const isReadableStreamLike = (stream: unknown): stream is ReadableStreamLike => {
  return typeof stream === 'object' && stream !== null && typeof (stream as any).getReader === 'function';
};

const isBlobLike = (value: unknown): value is BlobLike => {
  return typeof value === 'object' && value !== null && typeof (value as any).arrayBuffer === 'function';
};

export const parseS3Url = (url: string): ParsedS3Url | null => {
  const urlPattern = /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
  const match = url.match(urlPattern);

  if (!match) {
    return null;
  }

  const [, bucket, region, key] = match;
  return {
    bucket,
    region,
    key: decodeURIComponent(key),
  };
};

export const getS3ObjectStreamFromUrl = async (url: string): Promise<Readable> => {
  const parsed = parseS3Url(url);
  if (!parsed) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }

  const command = new GetObjectCommand({
    Bucket: parsed.bucket,
    Key: parsed.key,
  });

  const response = await getS3Client().send(command);
  const body = response.Body;

  if (!body) {
    throw new Error(`Empty S3 response body for ${url}`);
  }

  if (isNodeReadable(body)) {
    return body;
  }

  if (isReadableStreamLike(body)) {
    if (typeof Readable.fromWeb === 'function') {
      return Readable.fromWeb(body as any);
    }

    const reader = body.getReader();
    const asyncIterable = {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              yield Buffer.from(value);
            }
          }
        } finally {
          reader.releaseLock?.();
        }
      },
    };

    return Readable.from(asyncIterable as AsyncIterable<Buffer>);
  }

  if (isBlobLike(body)) {
    if (typeof body.stream === 'function' && typeof Readable.fromWeb === 'function') {
      return Readable.fromWeb(body.stream() as any);
    }

    const buffer = Buffer.from(await body.arrayBuffer());
    return Readable.from(buffer);
  }

  throw new Error(`Unsupported S3 body type for ${url}`);
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

export const deleteFromS3 = async (url: string): Promise<void> => {
  try {
    const parsed = parseS3Url(url);
    if (!parsed) {
      console.error('Invalid S3 URL format:', url);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: parsed.bucket,
      Key: parsed.key,
    });

    await getS3Client().send(command);
    console.log(`✓ Deleted from S3: ${parsed.key}`);
  } catch (error) {
    console.error(`✗ Failed to delete from S3: ${url}`, error);
    // Don't throw - allow deletion to continue even if S3 delete fails
  }
};

export const bulkDeleteFromS3 = async (urls: string[]): Promise<void> => {
  // Group URLs by bucket
  const urlsByBucket = new Map<string, string[]>();
  
  for (const url of urls) {
    const parsed = parseS3Url(url);
    if (parsed) {
      if (!urlsByBucket.has(parsed.bucket)) {
        urlsByBucket.set(parsed.bucket, []);
      }
      urlsByBucket.get(parsed.bucket)!.push(parsed.key);
    }
  }

  // Delete from each bucket
  for (const [bucket, keys] of urlsByBucket.entries()) {
    try {
      const command = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map(Key => ({ Key })),
          Quiet: false,
        },
      });

      const result = await getS3Client().send(command);
      console.log(`✓ Deleted ${keys.length} objects from S3 bucket: ${bucket}`);
      
      if (result.Errors && result.Errors.length > 0) {
        console.error(`Errors deleting some objects:`, result.Errors);
      }
    } catch (error) {
      console.error(`✗ Failed to delete from S3 bucket ${bucket}:`, error);
    }
  }
};
