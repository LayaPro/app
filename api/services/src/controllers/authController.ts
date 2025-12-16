import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import User from '../models/user';
import Tenant from '../models/tenant';
import Role from '../models/role';
import { AuthenticatedRequest } from '../middleware/auth';
import { User as BaseUser } from 'laya-shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

interface SetPasswordRequest {
  email: string;
  temporaryPassword: string;
  newPassword: string;
  tenantId: string;
}

interface CreateTenantUserRequest extends Partial<BaseUser> {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  tenantId: string;
}



// Generate JWT token
const generateToken = (userId: string, email: string, roleId: string, roleName: string, tenantId: string): string => {
  const payload = { 
    userId, 
    email, 
    roleId,
    roleName, 
    tenantId,
    type: 'access'
  };
  
  const options: SignOptions = { 
    expiresIn: '7d' 
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
};

// Generate temporary password
const generateTemporaryPassword = (): string => {
  return nanoid(12); // 12 character random string
};

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId }: LoginRequest = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and tenantId are required'
      });
    }

    // Find user by email and tenantId, then populate role information
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      tenantId: tenantId
    }).populate<{roleId: any}>('roleId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check if password is set (not using temporary password)
    if (!user.isPasswordSet && user.temporaryPassword) {
      // User needs to set their password first
      const isTemporaryPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isTemporaryPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Please set your new password',
        requiresPasswordSet: true,
        email: user.email
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with role information
    const roleDoc = user.roleId as any; // populated role document
    const token = generateToken(user.userId, user.email, user.roleId, roleDoc.name, user.tenantId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: roleDoc.name,
        tenantId: user.tenantId,
        isPasswordSet: user.isPasswordSet
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const setPassword = async (req: Request, res: Response) => {
  try {
    const { email, temporaryPassword, newPassword, tenantId }: SetPasswordRequest = req.body;

    if (!email || !temporaryPassword || !newPassword || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Email, temporary password, new password, and tenantId are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Find user by email and tenantId, then populate role information
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      tenantId: tenantId
    }).populate<{roleId: any}>('roleId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const roleDoc = user.roleId;

    // Verify temporary password
    const isTemporaryPasswordValid = await verifyPassword(temporaryPassword, user.passwordHash);
    if (!isTemporaryPasswordValid || user.isPasswordSet) {
      return res.status(401).json({
        success: false,
        message: 'Invalid temporary password or password already set'
      });
    }

    // Hash new password and update user
    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    user.isPasswordSet = true;
    user.temporaryPassword = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate token for automatic login
    const token = generateToken(user.userId, user.email, user.roleId._id, roleDoc.name, user.tenantId);

    res.status(200).json({
      success: true,
      message: 'Password set successfully',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: roleDoc.name,
        tenantId: user.tenantId,
        isPasswordSet: user.isPasswordSet
      }
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createTenantUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId, tenantId }: CreateTenantUserRequest = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !roleId || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if user with email already exists in this tenant
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      tenantId: tenantId
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists in this tenant'
      });
    }

    // Generate temporary password and hash it
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    // Create new user
    const newUser = new User({
      tenantId,
      userId: nanoid(),
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      roleId,
      isActive: true,
      isPasswordSet: false,
      temporaryPassword
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roleId: newUser.roleId,
        roleName: role.name,
        tenantId: newUser.tenantId,
        isPasswordSet: newUser.isPasswordSet
      },
      temporaryPassword // Return this for admin to share with user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // User info is already validated by authenticate middleware
    // Filter by both userId and tenantId for extra security
    const user = await User.findOne({ 
      userId: req.user?.userId,
      tenantId: req.user?.tenantId
    }).populate<{roleId: any}>('roleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const roleDoc = user.roleId;

    res.status(200).json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: roleDoc.name,
        tenantId: user.tenantId,
        isPasswordSet: user.isPasswordSet
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createSuperuser = async (req: Request, res: Response) => {
  try {
    // Create superadmin role if it doesn't exist
    let superadminRole = await Role.findOne({ name: 'superadmin' });
    if (!superadminRole) {
      superadminRole = new Role({
        roleId: nanoid(),
        name: 'superadmin',
        description: 'System superadmin with full access'
      });
      await superadminRole.save();
    }

    const existingSuperuser = await User.findOne({ roleId: superadminRole._id });
    if (existingSuperuser) {
      return res.status(400).json({
        success: false,
        message: 'Superuser already exists. This endpoint is for bootstrap only.'
      });
    }

    const { email, firstName, lastName, password, tenantName, tenantUsername } = req.body;

    if (!email || !firstName || !lastName || !password || !tenantName || !tenantUsername) {
      return res.status(400).json({
        success: false,
        message: 'All fields required: email, firstName, lastName, password, tenantName, tenantUsername'
      });
    }

    // Create system tenant
    const systemTenantId = nanoid();
    const systemTenant = new Tenant({
      tenantId: systemTenantId,
      tenantFirstName: firstName,
      tenantLastName: lastName,
      tenantCompanyName: tenantName,
      tenantUsername: tenantUsername.toLowerCase(),
      tenantEmailAddress: email.toLowerCase(),
      subscriptionPlan: 'system',
      isActive: true,
      createdBy: 'system'
    });

    await systemTenant.save();

    // Create superuser
    const passwordHash = await hashPassword(password);
    const superuser = new User({
      tenantId: systemTenantId,
      userId: nanoid(),
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      roleId: superadminRole._id,
      isActive: true,
      isPasswordSet: true
    });

    await superuser.save();

    // Generate token
    const token = generateToken(superuser.userId, superuser.email, superuser.roleId.toString(), 'superadmin', superuser.tenantId);

    res.status(201).json({
      success: true,
      message: 'Superuser and system tenant created successfully',
      token,
      user: {
        userId: superuser.userId,
        email: superuser.email,
        firstName: superuser.firstName,
        lastName: superuser.lastName,
        roleId: superuser.roleId.toString(),
        roleName: 'superadmin',
        tenantId: superuser.tenantId,
        isPasswordSet: superuser.isPasswordSet
      },
      tenant: {
        tenantId: systemTenant.tenantId,
        tenantName: systemTenant.tenantCompanyName,
        tenantUsername: systemTenant.tenantUsername
      }
    });
  } catch (error) {
    console.error('Create superuser error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};