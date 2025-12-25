import sharp from 'sharp';

export interface CompressionResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export const compressImage = async (
  buffer: Buffer,
  options: {
    maxWidth?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}
): Promise<CompressionResult> => {
  const { maxWidth = 1920, quality = 80, format = 'jpeg' } = options;

  let pipeline = sharp(buffer)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

  // Apply format-specific compression
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality, compressionLevel: 9 });
  }

  const compressedBuffer = await pipeline.toBuffer();
  const metadata = await sharp(compressedBuffer).metadata();

  return {
    buffer: compressedBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: compressedBuffer.length,
  };
};

export const createThumbnail = async (
  buffer: Buffer,
  size: number = 300
): Promise<Buffer> => {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 70 })
    .toBuffer();
};
