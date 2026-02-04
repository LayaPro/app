# Super Admin Portal Setup

This document explains how to set up and use the Super Admin portal for managing tenants in the Laya Pro multi-tenant system.

## Features

The Super Admin portal provides:

- **Tenant Management**: View, create, edit, and activate/deactivate tenants
- **Statistics Dashboard**: See total tenants, active/inactive counts
- **Tenant Details**: View project counts and storage usage per tenant
- **Search & Filter**: Quick search across tenant names, emails, and contacts
- **Simple HTML Interface**: No React/build process required - just open and use

## Setup Instructions

### 1. Mark a User as Super Admin

To grant super admin privileges to an existing user:

```bash
cd api/services
npm run set-super-admin user@example.com
```

This will:
- Find the user by email
- Set `isSuperAdmin: true` on their account
- Display confirmation with user details

### 2. Access the Portal

Once a user is marked as super admin:

1. Start your API server (if not already running):
   ```bash
   npm run dev
   ```

2. Open the super admin portal in your browser:
   ```
   http://localhost:4000/super-admin.html
   ```

3. Login with your super admin credentials

## API Endpoints

The super admin portal uses these protected endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current user info (includes isSuperAdmin flag) |
| GET | `/super-admin/tenants` | List all tenants with statistics |
| GET | `/super-admin/tenants/:tenantId` | Get single tenant details |
| POST | `/super-admin/tenants` | Create new tenant |
| PUT | `/super-admin/tenants/:tenantId` | Update tenant info |
| PATCH | `/super-admin/tenants/:tenantId` | Activate/deactivate tenant |
| DELETE | `/super-admin/tenants/:tenantId` | Soft delete tenant (only if no projects) |

All endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User must have `isSuperAdmin: true` flag

## Tenant Statistics

For each tenant, the portal displays:

- **Project Count**: Total number of projects
- **Storage Used**: Total file size of all images (in GB)
- **Status**: Active or Inactive
- **Creation Date**: When the tenant was added

## Security

- Only users with `isSuperAdmin: true` can access the portal
- Regular admins will see "Access denied" message
- Authentication is required for all operations
- Token is stored in localStorage (cleared on logout)

## Database Schema

### User Model Enhancement

Added `isSuperAdmin` field to User model:

```typescript
interface IUser {
  // ... existing fields
  isSuperAdmin?: boolean; // Super admin for multi-tenant management
}
```

## Usage Notes

1. **Creating Tenants**: All new tenants are created with `isActive: true` by default
2. **Deactivating Tenants**: Deactivated tenants cannot login or perform actions
3. **Deleting Tenants**: Can only delete tenants with zero projects (soft delete via deactivation)
4. **Search**: Search works across tenant name, email, and contact person fields
5. **Real-time Updates**: After any operation, the tenant list automatically refreshes

## Troubleshooting

### "Access denied" error
- Verify the user has been marked as super admin using the `set-super-admin` script
- Check that you're logged in with the correct account

### "Authentication required" error
- Token may have expired - logout and login again
- Check browser console for any CORS issues

### Tenants not loading
- Verify API server is running
- Check network tab for 401/403 errors
- Ensure MongoDB connection is active

## Future Enhancements

Potential additions for the super admin portal:

- [ ] Usage analytics and charts
- [ ] Tenant-specific configuration (storage limits, feature flags)
- [ ] Billing and subscription management
- [ ] Audit logs for super admin actions
- [ ] Bulk tenant operations
- [ ] Export tenant data
