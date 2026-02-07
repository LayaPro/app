# Marketing Site Signup & Authentication Setup

## Overview
The marketing website now includes a complete signup flow with Google SSO and email authentication. Users can sign up from the marketing site and are automatically redirected to the admin dashboard.

## Features
- ✅ Email/password signup
- ✅ Google OAuth SSO
- ✅ Automatic tenant creation
- ✅ Admin role assignment
- ✅ 14-day free trial
- ✅ JWT authentication
- ✅ Audit logging

## Setup Instructions

### 1. Configure Environment Variables

**Marketing App** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:5173
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**API Server** (`.env`):
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3002/auth/google/callback
JWT_SECRET=your-secret-key
```

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set Authorized redirect URIs:
   - `http://localhost:3002/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret

### 3. Update CORS Settings

Add marketing site URL to API CORS whitelist in `server.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3002', // Marketing site
  // ... other origins
];
```

## User Flow

### Email Signup
1. User clicks "Try for Free" or "Start Free Trial"
2. Redirected to `/signup` page
3. Fills form: Studio Name, Full Name, Email, Password
4. Clicks "Create Account"
5. Backend creates:
   - New tenant with 14-day trial
   - Admin role with full permissions
   - User account with hashed password
6. Returns JWT token
7. Frontend stores token and tenantId
8. Redirects to admin dashboard

### Google OAuth Signup
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User approves permissions
4. Google redirects to `/auth/google/callback` with code
5. Frontend sends code to backend `/auth/google/callback`
6. Backend:
   - Exchanges code for Google access token
   - Fetches user info from Google
   - Creates tenant + user (if new) or logs in existing user
7. Returns JWT token
8. Redirects to admin dashboard

## API Endpoints

### POST `/auth/signup`
**Request:**
```json
{
  "tenantName": "Studio Name",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tenant": {
    "_id": "tenant-id",
    "name": "Studio Name",
    "status": "trial"
  }
}
```

### POST `/auth/google/callback`
**Request:**
```json
{
  "code": "google-auth-code"
}
```

**Response:** Same as signup

## Testing

### Test Email Signup
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Studio",
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Login After Signup
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## Troubleshooting

### Google OAuth Issues
- Ensure redirect URI matches exactly in Google Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Verify Google+ API is enabled

### CORS Errors
- Add marketing site URL to CORS whitelist
- Check API is running and accessible

### Token Issues
- Verify JWT_SECRET is set in API
- Check token is being stored in localStorage
- Ensure admin app validates token correctly

## Production Deployment

1. Update environment variables with production URLs
2. Add production redirect URI to Google Console
3. Use HTTPS for all URLs
4. Set secure JWT_SECRET
5. Enable rate limiting on auth endpoints
6. Set up proper error monitoring

## Security Considerations

✅ Passwords hashed with bcrypt (10 rounds)
✅ JWT tokens expire in 30 days
✅ Audit logging for all auth events
✅ Email validation
✅ Password minimum length: 8 characters
✅ Google OAuth for trusted authentication
✅ CORS protection
✅ Input validation and sanitization

## Next Steps

- [ ] Add email verification
- [ ] Implement 2FA
- [ ] Add rate limiting
- [ ] Social login (Facebook, LinkedIn)
- [ ] Password strength meter
- [ ] Remember me functionality
