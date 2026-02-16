import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/user';
import Role from '../models/role';
import { TenantSubscription } from '../models/tenantSubscription';
import { SubscriptionPlan } from '../models/subscriptionPlan';
import { sendActivationEmail, sendPasswordResetEmail } from '../services/emailService';
import { createTenantWithSubscription } from '../services/tenantService';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';
import { checkAndCreateOrganizationSetupTodo } from '../jobs/checkOrganizationSetup';

const logger = createModuleLogger('AuthController');

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN: number = Number(process.env.JWT_EXPIRES_IN) || 7 * 24 * 60 * 60;

// Hardcoded Super Admin Credentials
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@laya.pro';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'LayaPro@SuperAdmin2026';

logger.info('JWT configuration loaded', { secretLength: JWT_SECRET?.toString().length });

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { email, password }: LoginRequest = req.body;

  logger.info(`[${requestId}] Login attempt`, { email });

  try {
    // Validate input
    if (!email || !password) {
      logger.warn(`[${requestId}] Missing credentials`, { email });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for hardcoded Super Admin credentials first
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && password === SUPER_ADMIN_PASSWORD) {
      logger.info(`[${requestId}] Super Admin login`, { email });
      
      // Generate JWT token for super admin
      const payload = {
        userId: 'super-admin-001',
        email: SUPER_ADMIN_EMAIL,
        roleId: 'super-admin-role',
        roleName: 'Super Admin',
        tenantId: 'internal',
        isSuperAdmin: true
      };
      
      const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN
      };
      
      const token = jwt.sign(payload, JWT_SECRET, options);

      return res.status(200).json({
        message: 'Super Admin login successful',
        token,
        user: {
          userId: 'super-admin-001',
          email: SUPER_ADMIN_EMAIL,
          firstName: 'Super',
          lastName: 'Admin',
          roleId: 'super-admin-role',
          roleName: 'Super Admin',
          tenantId: 'internal',
          isSuperAdmin: true
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`[${requestId}] User not found`, { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`[${requestId}] Account deactivated`, { email, userId: user.userId });
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check if password is set (account activated)
    if (!user.passwordHash) {
      logger.warn(`[${requestId}] Account not activated`, { email, userId: user.userId });
      return res.status(403).json({ message: 'Please activate your account first' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`[${requestId}] Invalid password`, { email, userId: user.userId });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user needs to set a new password (first time login)
    if (!user.isActivated) {
      // Generate a temporary token for password setup
      const setupToken = jwt.sign(
        { userId: user.userId, email: user.email, purpose: 'setup-password' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        requirePasswordSetup: true,
        setupToken,
        message: 'Please set a new password',
        userId: user.userId,
        email: user.email
      });
    }

    // Get user role
    const role = await Role.findOne({ roleId: user.roleId });
    if (!role) {
      logger.error(`[${requestId}] Role not found`, { email, userId: user.userId, roleId: user.roleId });
      return res.status(500).json({ message: 'User role not found' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      userId: user.userId,
      email: user.email,
      roleId: user.roleId,
      roleName: role.name,
      tenantId: user.tenantId
    };
    
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'User',
      entityId: user.userId,
      tenantId: user.tenantId,
      performedBy: user.userId,
      changes: {},
      metadata: { action: 'login', email: user.email },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Login successful`, { email, userId: user.userId, tenantId: user.tenantId });

    // Check organization setup and create todo if needed (async, don't wait)
    checkAndCreateOrganizationSetupTodo(user.tenantId).catch(err => {
      logger.error(`[${requestId}] Error checking organization setup`, { error: err.message });
    });

    // Return success response
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: role.name,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin || false
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Login error`, { email, error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Logout`);
  // For JWT, logout is typically handled client-side by removing the token
  // Optionally, you can implement token blacklisting here
  return res.status(200).json({ message: 'Logout successful' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  // @ts-ignore - userId is added by authenticate middleware
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Fetching current user`, { userId });

  try {
    if (!userId) {
      logger.warn(`[${requestId}] No userId in request`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if it's the hardcoded super admin
    if (userId === 'super-admin-001') {
      logger.info(`[${requestId}] Super admin user retrieved`);
      return res.json({
        userId: 'super-admin-001',
        email: SUPER_ADMIN_EMAIL,
        firstName: 'Super',
        lastName: 'Admin',
        name: 'Super Admin',
        roleId: 'super-admin-role',
        roleName: 'Super Admin',
        tenantId: 'internal',
        isSuperAdmin: true
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      logger.warn(`[${requestId}] User not found`, { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ roleId: user.roleId });

    logger.info(`[${requestId}] Current user retrieved`, { userId, tenantId: user.tenantId });

    return res.json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      roleId: user.roleId,
      roleName: role?.name,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin || false
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error getting current user`, { userId, error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Verifying token`);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`[${requestId}] No token provided`);
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Optionally verify user still exists and is active
    const user = await User.findOne({ userId: decoded.userId });
    if (!user || !user.isActive) {
      logger.warn(`[${requestId}] Invalid or inactive user`, { userId: decoded.userId });
      return res.status(401).json({ message: 'Invalid token' });
    }

    logger.info(`[${requestId}] Token verified`, { userId: decoded.userId, tenantId: decoded.tenantId });

    return res.status(200).json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        roleId: decoded.roleId,
        roleName: decoded.roleName,
        tenantId: decoded.tenantId
      }
    });
  } catch (err: any) {
    logger.warn(`[${requestId}] Token verification failed`, { error: err.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  logger.info(`[${requestId}] Refreshing token`);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`[${requestId}] No token provided for refresh`);
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify user still exists and is active
    const user = await User.findOne({ userId: decoded.userId });
    if (!user || !user.isActive) {
      logger.warn(`[${requestId}] Invalid or inactive user for refresh`, { userId: decoded.userId });
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user role
    const role = await Role.findOne({ roleId: user.roleId });
    if (!role) {
      logger.error(`[${requestId}] Role not found for refresh`, { userId: user.userId, roleId: user.roleId });
      return res.status(500).json({ message: 'User role not found' });
    }

    // Generate new JWT token
    const payload = {
      userId: user.userId,
      email: user.email,
      roleId: user.roleId,
      roleName: role.name,
      tenantId: user.tenantId
    };
    
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN
    };
    
    const newToken = jwt.sign(payload, JWT_SECRET, options);

    logger.info(`[${requestId}] Token refreshed`, { userId: user.userId, tenantId: user.tenantId });

    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (err: any) {
    logger.warn(`[${requestId}] Token refresh failed`, { error: err.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { email } = req.body;

  logger.info(`[${requestId}] Forgot password request`, { email });

  try {
    if (!email) {
      logger.warn(`[${requestId}] Email missing in forgot password`);
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      logger.info(`[${requestId}] Forgot password - user not found`, { email });
      return res.status(200).json({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    logger.info(`[${requestId}] Password reset token generated`, { email, userId: user.userId });

    // In production, send email with reset link containing the resetToken
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail({ to: user.email, subject: 'Password Reset', html: resetUrl });

    return res.status(200).json({
      message: 'If the email exists, a password reset link has been sent',
      // Remove this in production - only for development/testing
      resetToken // Send this via email in production
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Forgot password error`, { email, error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { token, newPassword } = req.body;

  logger.info(`[${requestId}] Reset password attempt`);

  try {
    if (!token || !newPassword) {
      logger.warn(`[${requestId}] Missing token or password`);
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      logger.warn(`[${requestId}] Password too short`);
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the provided token to match with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      logger.warn(`[${requestId}] Invalid or expired reset token`);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate existing tokens
    await user.save();

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'User',
      entityId: user.userId,
      tenantId: user.tenantId,
      performedBy: user.userId,
      changes: {},
      metadata: { action: 'password_reset' },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Password reset successful`, { userId: user.userId, email: user.email });

    return res.status(200).json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Reset password error`, { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { token, password } = req.body;

  logger.info(`[${requestId}] Setup password attempt`);

  try {
    if (!token || !password) {
      logger.warn(`[${requestId}] Missing token or password`);
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 8) {
      logger.warn(`[${requestId}] Password too short`);
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    let user;

    // Try to verify as JWT token first (for new tenant flow)
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.purpose === 'setup-password' && decoded.userId) {
        user = await User.findOne({ userId: decoded.userId });
      }
    } catch (jwtError) {
      // If JWT verification fails, try activation token hash method
      const activationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user = await User.findOne({
        activationToken: activationTokenHash,
        activationTokenExpires: { $gt: new Date() }
      });
    }

    if (!user) {
      logger.warn(`[${requestId}] Invalid or expired setup token`);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and activate account
    user.passwordHash = passwordHash;
    user.passwordSalt = salt;
    user.isActivated = true;
    user.activationToken = null;
    user.activationTokenExpires = null;
    await user.save();

    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'User',
      entityId: user.userId,
      tenantId: user.tenantId,
      performedBy: user.userId,
      changes: {},
      metadata: { action: 'password_setup', activated: true },
      ipAddress: req.ip
    });

    logger.info(`[${requestId}] Password setup successful`, { userId: user.userId, email: user.email });

    return res.status(200).json({
      message: 'Password setup successful. You can now login with your credentials.'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Setup password error`, { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendActivationLink = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.body;

  logger.info(`[${requestId}] Sending activation link`, { userId });

  try {
    if (!userId) {
      logger.warn(`[${requestId}] User ID missing`);
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      logger.warn(`[${requestId}] User not found`, { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate activation token (valid for 24 hours)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');
    
    user.activationToken = activationTokenHash;
    user.activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send activation email
    await sendActivationEmail(user.email, `${user.firstName} ${user.lastName}`, activationToken);

    logger.info(`[${requestId}] Activation link sent`, { userId, email: user.email });

    return res.status(200).json({
      message: 'Activation link sent successfully'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Send activation link error`, { userId, error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Failed to send activation link' });
  }
};

export const resendActivationLink = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { email } = req.body;

  logger.info(`[${requestId}] Resending activation link`, { email });

  try {
    if (!email) {
      logger.warn(`[${requestId}] Email missing`);
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`[${requestId}] User not found for resend`, { email });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActivated) {
      logger.warn(`[${requestId}] Account already activated`, { email, userId: user.userId });
      return res.status(400).json({ message: 'Account is already activated' });
    }

    // Generate new activation token (valid for 24 hours)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');
    
    user.activationToken = activationTokenHash;
    user.activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send activation email
    await sendActivationEmail(user.email, `${user.firstName} ${user.lastName}`, activationToken);

    logger.info(`[${requestId}] Activation link resent`, { email, userId: user.userId });

    return res.status(200).json({
      message: 'Activation link resent successfully'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Resend activation link error`, { email, error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Failed to resend activation link' });
  }
};

export const signup = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  
  try {
    const { tenantName, email, password, fullName } = req.body;

    logger.info(`[${requestId}] Signup request received`, { email, tenantName });

    // Validate input
    if (!tenantName || !email || !password || !fullName) {
      logger.warn(`[${requestId}] Missing required fields`);
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn(`[${requestId}] User already exists`, { email });
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if tenant already exists with this email
    const Tenant = require('../models/tenant').default;
    const existingTenant = await Tenant.findOne({ tenantEmailAddress: email.toLowerCase() });
    if (existingTenant) {
      logger.warn(`[${requestId}] Tenant already exists with this email`, { email, tenantId: existingTenant.tenantId });
      return res.status(400).json({ 
        message: 'An account already exists with this email. Please login instead or use a different email.' 
      });
    }

    // Parse name for tenant creation
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create tenant with subscription using common service
    const tenantId = nanoid(12);
    const { tenant } = await createTenantWithSubscription({
      tenantId,
      firstName,
      lastName,
      companyName: tenantName,
      email,
      planCode: 'FREE',
      trialDays: 14,
      createdBy: 'system',
    });

    logger.info(`[${requestId}] Tenant and subscription created`, { tenantId: tenant.tenantId, tenantName });

    // Find existing Admin role (global role with tenantId: '-1')
    let adminRole = await Role.findOne({ name: 'Admin', tenantId: '-1' });
    
    if (!adminRole) {
      // If no global admin role exists, create one
      adminRole = await Role.create({
        roleId: nanoid(12),
        name: 'Admin',
        tenantId: '-1',
        description: 'Full control of entire system',
      });
      logger.info(`[${requestId}] Admin role created`, { roleId: adminRole.roleId });
    } else {
      logger.info(`[${requestId}] Using existing Admin role`, { roleId: adminRole.roleId });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse name for user creation
    const userNameParts = fullName.split(' ');
    const userFirstName = userNameParts[0] || fullName;
    const userLastName = userNameParts.slice(1).join(' ') || 'User';

    // Create user
    const user = await User.create({
      userId: `user_${nanoid()}`,
      firstName: userFirstName,
      lastName: userLastName,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      tenantId: tenant.tenantId,
      roleId: adminRole.roleId,
      isActive: true,
      isActivated: true,
    });

    logger.info(`[${requestId}] User created`, { userId: user.userId, email, tenantId: tenant.tenantId });

    // Log audit trail
    await logAudit({
      action: auditEvents.USER_CREATED,
      entityType: 'User',
      entityId: user.userId,
      userId: user.userId,
      tenantId: tenant.tenantId,
      metadata: { email, tenantName, signupMethod: 'email', requestId },
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        tenantId: tenant.tenantId, 
        roleId: adminRole.roleId,
        roleName: adminRole.name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info(`[${requestId}] Signup successful`, { userId: user.userId, tenantId: tenant.tenantId });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: adminRole.roleId,
        roleName: 'Admin',
        tenantId: tenant.tenantId,
      },
      tenant: {
        id: tenant.tenantId,
        name: tenant.tenantCompanyName,
        status: tenant.subscriptionPlan,
      },
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Signup error`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error creating account. Please try again.' });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  
  try {
    const { code, redirectUri } = req.body;

    logger.info(`[${requestId}] Google OAuth callback received`);

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Validate redirect URI (whitelist)
    const allowedRedirectUris = [
      'http://localhost:3002/auth/google/callback', // Marketing site
      'http://localhost:5173/auth/google/callback', // Admin app
      process.env.GOOGLE_REDIRECT_URI, // Production
    ].filter(Boolean);

    const finalRedirectUri = redirectUri && allowedRedirectUris.includes(redirectUri) 
      ? redirectUri 
      : process.env.GOOGLE_REDIRECT_URI;

    logger.debug(`[${requestId}] Using redirect URI: ${finalRedirectUri}`);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      logger.error(`[${requestId}] Failed to get access token from Google`);
      return res.status(400).json({ message: 'Failed to authenticate with Google' });
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const googleUser = await userInfoResponse.json();
    const email = googleUser.email.toLowerCase();
    const fullName = googleUser.name;

    logger.info(`[${requestId}] Google user info retrieved`, { email, name: fullName });

    // Check if user already exists
    let user = await User.findOne({ email });
    let tenant;

    const Tenant = require('../models/tenant').default;

    if (user) {
      // Existing user - just login
      tenant = await Tenant.findOne({ tenantId: user.tenantId });
      logger.info(`[${requestId}] Existing user logged in via Google`, { userId: user.userId, tenantId: tenant?.tenantId });
      
      await logAudit({
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.userId,
        userId: user.userId,
        tenantId: tenant?.tenantId || user.tenantId,
        metadata: { loginMethod: 'google', requestId },
      });
    } else {
      // New user - use atomic findOne to prevent race conditions
      try {
        tenant = await Tenant.findOne({ tenantEmailAddress: email });

        if (!tenant) {
          // No existing tenant - create new tenant with transaction (already atomic)
          logger.info(`[${requestId}] Creating new tenant for Google signup`, { email });
          
          // Parse name for tenant creation
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.slice(1).join(' ') || '';

          // Create tenant with subscription using transactional service
          const tenantId = nanoid(12);
          const result = await createTenantWithSubscription({
            tenantId,
            firstName,
            lastName,
            companyName: `${fullName}'s Studio`,
            email,
            planCode: 'FREE',
            trialDays: 14,
            createdBy: 'google-oauth',
          });
          tenant = result.tenant;

          logger.info(`[${requestId}] Tenant created successfully`, { tenantId: tenant.tenantId });
        } else {
          logger.info(`[${requestId}] Tenant already exists with this email`, { 
            email, 
            existingTenantId: tenant.tenantId 
          });
        }

        // Double-check: verify no user exists for this tenant with this email
        const existingUserForTenant = await User.findOne({ 
          email, 
          tenantId: tenant.tenantId 
        });

        if (existingUserForTenant) {
          logger.warn(`[${requestId}] User already exists for this tenant, logging in`, { 
            email, 
            userId: existingUserForTenant.userId,
            tenantId: tenant.tenantId 
          });
          // User exists - treat as login
          user = existingUserForTenant;
          
          await logAudit({
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user.userId,
            userId: user.userId,
            tenantId: tenant.tenantId,
            metadata: { loginMethod: 'google', requestId },
          });
        } else {
          // Create user
          logger.info(`[${requestId}] Creating user for tenant`, { tenantId: tenant.tenantId });

          // Find existing Admin role (global role with tenantId: '-1')
          let adminRole = await Role.findOne({ name: 'Admin', tenantId: '-1' });
          
          if (!adminRole) {
            // If no global admin role exists, create one
            adminRole = await Role.create({
              roleId: nanoid(12),
              name: 'Admin',
              tenantId: '-1',
              description: 'Full control of entire system',
            });
            logger.info(`[${requestId}] Admin role created`, { roleId: adminRole.roleId });
          } else {
            logger.info(`[${requestId}] Using existing Admin role`, { roleId: adminRole.roleId });
          }

          // Create user
          const userNameParts = fullName.split(' ');
          const userFirstName = userNameParts[0] || fullName;
          const userLastName = userNameParts.slice(1).join(' ') || 'User';
          
          user = await User.create({
            userId: `user_${nanoid()}`,
            firstName: userFirstName,
            lastName: userLastName,
            email,
            tenantId: tenant.tenantId,
            roleId: adminRole.roleId,
            isActive: true,
            isActivated: true,
          });

          logger.info(`[${requestId}] User created via Google signup`, { userId: user.userId, tenantId: tenant.tenantId });

          await logAudit({
            action: auditEvents.USER_CREATED,
            entityType: 'User',
            entityId: user.userId,
            userId: user.userId,
            tenantId: tenant.tenantId,
            metadata: { email, signupMethod: 'google', requestId },
          });
        }
      } catch (err: any) {
        // Handle duplicate key errors gracefully
        if (err.message && err.message.includes('already exists')) {
          logger.warn(`[${requestId}] Race condition detected, retrying lookup`, { email });
          // Retry - look up the tenant and user that was just created by concurrent request
          tenant = await Tenant.findOne({ tenantEmailAddress: email });
          user = await User.findOne({ email });
          
          if (user && tenant) {
            logger.info(`[${requestId}] Using existing tenant and user from concurrent request`, {
              userId: user.userId,
              tenantId: tenant.tenantId
            });
          } else {
            throw new Error('Failed to create or retrieve account. Please try again.');
          }
        } else {
          throw err;
        }
      }
    }

    // Get user role
    const role = await Role.findOne({ roleId: user.roleId });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        tenantId: user.tenantId, 
        roleId: user.roleId,
        roleName: role?.name || 'Admin',
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info(`[${requestId}] Google OAuth successful`, { userId: user.userId, tenantId: tenant.tenantId });

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: role?.name || 'Admin',
        tenantId: tenant.tenantId,
      },
      tenant: {
        id: tenant.tenantId,
        name: tenant.tenantCompanyName,
        status: tenant.subscriptionPlan,
      },
    });
  } catch (error: any) {
    console.error(`[${requestId}] Google OAuth full error:`, error);
    logger.error(`[${requestId}] Google OAuth error`, { 
      message: error.message, 
      stack: error.stack,
      name: error.name,
      fullError: JSON.stringify(error, null, 2)
    });
    res.status(500).json({ message: 'Error during Google authentication. Please try again.' });
  }
};

export default { 
  login, 
  logout,
  getCurrentUser,
  verifyToken, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  setupPassword,
  sendActivationLink,
  resendActivationLink,
  signup,
  googleCallback
};

