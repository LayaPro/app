# Storage Management & Subscription System

## Overview
Implemented a complete storage tracking and subscription plan system for tenants with visual indicators in the admin header.

## Features Added

### 1. **Subscription Plans** (5 Tiers)
- **Free Tier**: 1 GB - ₹0/month
- **Basic**: 100 GB - ₹2,499/month
- **Professional**: 300 GB - ₹6,499/month
- **Business**: 500 GB - ₹10,499/month
- **Enterprise**: 1000 GB - ₹19,999/month

### 2. **Database Models**

#### `SubscriptionPlan`
- Stores pricing tiers with storage limits in GB
- Features array for each plan
- Display order and active status

#### `TenantSubscription`
- Links tenant to their subscription plan
- Tracks storage used vs limit (in GB)
- Subscription status (ACTIVE, INACTIVE, SUSPENDED, CANCELLED)
- Payment status (PAID, PENDING, FAILED, FREE)
- Auto-renewal settings

### 3. **Storage Utilities** (`storageCalculator.ts`)

```typescript
// Calculate total storage from images
calculateTenantStorageUsed(tenantId): Promise<number>

// Update tenant's storage usage
updateTenantStorageUsage(tenantId): Promise<number>

// Get comprehensive stats
getTenantStorageStats(tenantId)

// Pre-validate uploads
canUpload(tenantId, uploadSizeBytes): Promise<boolean>
```

### 4. **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/storage/stats/:tenantId` | GET | Get storage stats |
| `/storage/refresh/:tenantId` | POST | Recalculate storage |
| `/storage/check-upload` | POST | Validate upload size |
| `/storage/plans` | GET | List all plans |
| `/storage/subscription/:tenantId` | PUT | Update subscription |

### 5. **Admin UI Component**

**StorageIndicator** - Replaces stats ticker in header:
- Real-time storage usage display
- Progress bar with color coding:
  - Green: < 80% used
  - Amber: 80-100% used
  - Red: > 100% (over limit)
- Shows remaining GB
- Plan name badge
- Auto-refreshes every 5 minutes

### 6. **Auto-Assignment**
- New tenants automatically get FREE tier on creation
- Subscription record created with 1 GB limit
- Storage tracking starts immediately

## Setup Instructions

1. **Run Seed Script**
   ```bash
   cd api/services
   npm run seed
   ```
   This creates the 5 subscription plans in the database.

2. **Storage Calculation**
   Storage is calculated from existing `Image.fileSize` (in bytes) and converted to GB.

3. **Frontend Display**
   The StorageIndicator component automatically appears in the admin header for all authenticated users.

## How It Works

### On Tenant Creation
1. Super admin creates tenant
2. System assigns FREE tier (1 GB)
3. `TenantSubscription` record created with `storageUsed: 0`

### During Image Upload
1. Check `canUpload()` before upload
2. Upload images
3. Storage auto-calculated from `Image.fileSize` field
4. Can manually refresh via `/storage/refresh/:tenantId`

### In Admin Dashboard
1. Header shows live storage indicator
2. Color-coded based on usage %
3. Warns when near/over limit
4. Click for detailed view (future enhancement)

## Storage Calculation Logic

```typescript
// Convert bytes to GB
images.reduce((total, img) => total + img.fileSize, 0) / (1024 * 1024 * 1024)

// Usage percentage
(storageUsed / storageLimit) * 100

// Color coding
if (> 100%) => RED (over limit)
else if (>= 80%) => AMBER (near limit)
else => GREEN (healthy)
```

## Future Enhancements
- Payment gateway integration
- Automatic upgrade prompts when nearing limit
- Storage usage analytics/charts
- Email notifications for storage alerts
- Block uploads when over limit
- Historical usage tracking
