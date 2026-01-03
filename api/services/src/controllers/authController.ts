import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/user';
import Role from '../models/role';
import { sendActivationEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN: number = Number(process.env.JWT_EXPIRES_IN) || 7 * 24 * 60 * 60;

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check if password is set (account activated)
    if (!user.passwordHash) {
      return res.status(403).json({ message: 'Please activate your account first' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user role
    const role = await Role.findOne({ roleId: user.roleId });
    if (!role) {
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
        tenantId: user.tenantId
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is typically handled client-side by removing the token
  // Optionally, you can implement token blacklisting here
  return res.status(200).json({ message: 'Logout successful' });
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Optionally verify user still exists and is active
    const user = await User.findOne({ userId: decoded.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

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
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify user still exists and is active
    const user = await User.findOne({ userId: decoded.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user role
    const role = await Role.findOne({ roleId: user.roleId });
    if (!role) {
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

    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (err: any) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
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

    // In production, send email with reset link containing the resetToken
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail({ to: user.email, subject: 'Password Reset', html: resetUrl });

    return res.status(200).json({
      message: 'If the email exists, a password reset link has been sent',
      // Remove this in production - only for development/testing
      resetToken // Send this via email in production
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
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

    return res.status(200).json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the provided token to match with stored hash
    const activationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid activation token
    const user = await User.findOne({
      activationToken: activationTokenHash,
      activationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired activation token' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and activate account
    user.passwordHash = passwordHash;
    user.isActivated = true;
    user.activationToken = null;
    user.activationTokenExpires = null;
    await user.save();

    return res.status(200).json({
      message: 'Password setup successful. You can now login with your credentials.'
    });
  } catch (err: any) {
    console.error('Setup password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendActivationLink = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
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

    return res.status(200).json({
      message: 'Activation link sent successfully'
    });
  } catch (err: any) {
    console.error('Send activation link error:', err);
    return res.status(500).json({ message: 'Failed to send activation link' });
  }
};

export const resendActivationLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActivated) {
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

    return res.status(200).json({
      message: 'Activation link resent successfully'
    });
  } catch (err: any) {
    console.error('Resend activation link error:', err);
    return res.status(500).json({ message: 'Failed to resend activation link' });
  }
};

export default { 
  login, 
  logout, 
  verifyToken, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  setupPassword,
  sendActivationLink,
  resendActivationLink
};
