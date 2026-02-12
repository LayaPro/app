# Cover Photo Focal Point Implementation

## Overview
This implementation allows users to set a single cover photo with a customizable focal point that works across all device screen sizes (mobile, tablet, desktop) without creating or storing multiple image files.

## How It Works

### 1. **Single Image + Focal Point Coordinates**
Instead of storing separate images for different screen sizes, we store:
- One source image URL (from gallery)
- Focal point coordinates (x%, y%) where the important subject is located

### 2. **Data Structure**

#### Backend (MongoDB - Project Model)
```typescript
coverImage?: {
  imageId: string;        // Reference to gallery image
  url: string;            // Original S3 URL
  focalPoint: {
    x: number;            // Percentage 0-100
    y: number;            // Percentage 0-100
  };
}
```

#### Example Data
```json
{
  "coverImage": {
    "imageId": "img_abc123",
    "url": "https://s3.../wedding-photo.jpg",
    "focalPoint": { "x": 45.5, "y": 32.8 }
  }
}
```

### 3. **User Flow**

1. **Admin App - Set Cover Photo**
   - Navigate to Albums page
   - Select a project and event
   - Select ONE image from gallery
   - Click "Bulk Actions" → "Set Cover Photo"
   - Modal opens showing the full image
   - Click anywhere on the image to set the focal point
   - A crosshair appears at the selected location
   - Click "Set as Cover Photo" to save

2. **Customer View - Gallery**
   - Cover photo displays with focal point respected
   - CSS `object-position` ensures the focal point stays centered
   - Works automatically across all device aspect ratios:
     - Mobile (9:16 portrait)
     - Tablet (4:3)
     - Desktop (16:9 landscape)

### 4. **Technical Implementation**

#### CSS (Customer Gallery)
```css
.gallery-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;              /* Crop to fill container */
  object-position: 45.5% 32.8%;   /* Keep focal point centered */
}
```

#### React Component
```tsx
const coverFocalPoint = useMemo(() => {
  if (coverImage?.focalPoint) {
    return `${coverImage.focalPoint.x}% ${coverImage.focalPoint.y}%`;
  }
  return 'center center'; // Default
}, [coverImage]);

<img 
  src={coverImage.url} 
  style={{ objectPosition: coverFocalPoint }}
/>
```

## Benefits

✅ **No Extra Storage** - Uses existing gallery images  
✅ **No Processing** - No image cropping or resizing needed  
✅ **Fast Loading** - Single image for all devices  
✅ **Simple UX** - One-click focal point selection  
✅ **Flexible** - Works with any aspect ratio  
✅ **Backward Compatible** - Falls back to old `mobileCoverUrl`, `tabletCoverUrl`, `desktopCoverUrl` fields

## Files Modified

### Backend
- `/api/services/src/models/project.ts` - Added coverImage field
- `/api/services/src/controllers/proposalController.ts` - Pass coverImage to frontend

### Admin App
- `/admin/admin-app/src/pages/Albums/index.tsx` - Single "Set Cover" button, focal point selection
- `/admin/admin-app/src/pages/Albums/components/FocalPointModal.tsx` - NEW: Focal point selector UI
- `/admin/admin-app/src/pages/Albums/components/FocalPointModal.module.css` - NEW: Modal styles
- `/admin/admin-app/src/types/index.ts` - Added coverImage to Project interface
- `/admin/admin-app/src/types/albums.ts` - Added coverImage to ProjectSummary interface

### Customer App
- `/customer-app/src/components/Gallery.tsx` - Use coverImage with focal point
- `/customer-app/src/components/CustomerPortal.tsx` - Pass coverImage prop

## Future Enhancements

- **Live Preview**: Show how the crop looks on mobile/tablet/desktop in real-time
- **Grid Overlay**: Rule-of-thirds grid for better composition
- **Zoom Controls**: Allow zooming before selecting focal point
- **Batch Setting**: Set cover for multiple projects at once

## Migration Notes

The old fields (`mobileCoverUrl`, `tabletCoverUrl`, `desktopCoverUrl`) are kept for backward compatibility. New cover photos use the `coverImage` structure. The system automatically falls back to old fields if `coverImage` is not set.

No database migration needed - both systems coexist peacefully! 🎉
