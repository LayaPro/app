# Batch Image Upload API

## Setup

### 1. Install Dependencies
```bash
cd api/services
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=your-bucket-name
```

### 3. AWS S3 Setup (Optional Optimization)
For faster uploads, enable **S3 Transfer Acceleration** on your bucket:
1. Go to AWS S3 Console
2. Select your bucket
3. Go to Properties → Transfer Acceleration
4. Enable it
5. Add to `.env`: `AWS_S3_USE_ACCELERATE_ENDPOINT=true`

## API Endpoint

### Upload Batch Images
Upload multiple images with automatic compression and S3 storage.

**Endpoint:** `POST /upload-batch-images`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `images`: Multiple image files (max 500 files, 50MB each)
- `projectId`: Project ID (string, required)
- `clientEventId`: Client Event ID (string, required)
- `eventDeliveryStatusId`: Event Delivery Status ID (string, optional)

**Example Request (cURL):**
```bash
curl -X POST http://localhost:4000/upload-batch-images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "projectId=proj_123" \
  -F "clientEventId=event_456" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('projectId', 'proj_123');
formData.append('clientEventId', 'event_456');

// Add multiple files
files.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('http://localhost:4000/upload-batch-images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

**Response (Success):**
```json
{
  "message": "Uploaded 500 of 500 images",
  "successful": [
    {
      "success": true,
      "imageId": "image_abc123",
      "fileName": "photo1.jpg",
      "originalUrl": "https://bucket.s3.region.amazonaws.com/originals/...",
      "compressedUrl": "https://bucket.s3.region.amazonaws.com/compressed/...",
      "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/thumbnails/..."
    }
    // ... more successful uploads
  ],
  "failed": [
    {
      "success": false,
      "fileName": "corrupted.jpg",
      "error": "Invalid image format"
    }
  ],
  "stats": {
    "total": 500,
    "successful": 498,
    "failed": 2
  }
}
```

## How It Works

### Image Processing Pipeline
1. **Receive Upload**: Server receives images via multipart form data
2. **Parallel Processing** (15 concurrent images):
   - **Compress**: Resize to max 1920px width, 80% quality JPEG
   - **Create Thumbnail**: 300x300px at 70% quality
   - **Upload to S3** (parallel):
     - Original → S3 Glacier Instant Retrieval
     - Compressed → S3 Standard
     - Thumbnail → S3 Standard
3. **Save Metadata**: Store URLs and metadata in MongoDB
4. **Return Results**: Report success/failure for each image

### Performance Characteristics
- **Compression Speed**: ~50-100 images/second
- **Upload Speed**: ~20-30 images/second (network dependent)
- **Memory Efficient**: Streams processing, no disk writes
- **Concurrency**: 15 images processed simultaneously
- **Expected Time for 500 images**: 2-5 minutes

### Storage Classes
- **Originals**: S3 Glacier Instant Retrieval (lower cost, instant access)
- **Compressed**: S3 Standard (fast access for serving)
- **Thumbnails**: S3 Standard (frequently accessed)

## Error Handling
- Individual image failures don't stop the batch
- Each image result includes success status
- Failed images include error message
- Server continues processing remaining images

## Limitations
- Max 500 files per request
- Max 50MB per file
- Only image files accepted (validated by MIME type)
- Total request size limited by server configuration (currently 50MB body limit)

## Tips for Best Performance
1. ✅ Enable S3 Transfer Acceleration
2. ✅ Use images already in optimal format (JPEG recommended)
3. ✅ Upload during off-peak hours for better network speed
4. ✅ Consider breaking very large batches into multiple requests
5. ✅ Use progress tracking on frontend for user feedback
