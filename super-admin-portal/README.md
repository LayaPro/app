# Super Admin Portal

Independent super admin portal for managing tenants across your multi-tenant SaaS.

## Quick Start

```bash
# Run the standalone server
node standalone-super-admin-server.js

# Access at: http://localhost:5000
```

Or simply open `super-admin-standalone.html` directly in your browser!

## Default Login Credentials

```
Email: superadmin@laya.pro
Password: LayaPro@SuperAdmin2026
```

These credentials are hardcoded and work without any database setup!

⚠️ **Change these in production** via `.env` file:
```env
SUPER_ADMIN_EMAIL=your-secure-email@company.com
SUPER_ADMIN_PASSWORD=YourVerySecurePassword123!
```

## Why Standalone?

This portal runs **independently** from your main API/admin app:
- Main API crashes? Portal stays up ✅
- Different port/infrastructure
- Can be deployed separately
- Works offline (file:// protocol)

## Files

- `super-admin-standalone.html` - Self-contained HTML portal
- `standalone-super-admin-server.js` - Minimal Node.js server
- `STANDALONE_SUPER_ADMIN.md` - Full documentation

## Usage

See [STANDALONE_SUPER_ADMIN.md](STANDALONE_SUPER_ADMIN.md) for complete setup instructions.
