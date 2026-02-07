import { Response } from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import User from '../models/user';
import Role from '../models/role';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('UserController');

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all users`, { tenantId });

  try {

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in request`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all users for the tenant (excluding password fields)
    const users = await User.find({ tenantId })
      .select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion')
      .sort({ createdAt: -1 })
      .lean();

    logger.debug(`[${requestId}] Found ${users.length} users for tenant`, { tenantId });

    // Populate role names
    const userIds = users.map(u => u.roleId);
    const roles = await Role.find({ roleId: { $in: userIds } }).lean();
    const roleMap = new Map(roles.map(r => [r.roleId, r.name]));

    const usersWithRoles = users.map(user => ({
      ...user,
      roleName: roleMap.get(user.roleId) || 'Unknown'
    }));

    logger.info(`[${requestId}] Users retrieved successfully`, {
      tenantId,
      count: usersWithRoles.length
    });

    return res.status(200).json({
      message: 'Users retrieved successfully',
      count: usersWithRoles.length,
      users: usersWithRoles
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Get all users failed`, {
      tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.params;
  const tenantId = req.user?.tenantId;
  const currentUserId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching user details`, { userId, tenantId });

  try {

    const user = await User.findOne({ userId })
      .select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion')
      .lean();

    if (!user) {
      logger.warn(`[${requestId}] User not found`, { userId, tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization: admin can view all users in tenant, regular users can only view themselves
    const isAdmin = roleName === 'Admin';
    if (!isAdmin && user.userId !== currentUserId) {
      logger.warn(`[${requestId}] Access denied: User tried to view another user's profile`, {
        userId,
        currentUserId,
        isAdmin,
        tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied: Tenant mismatch`, {
        userId,
        userTenantId: user.tenantId,
        requestTenantId: tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only view users from your own tenant.' });
    }

    // Get role name
    const role = await Role.findOne({ roleId: user.roleId }).lean();

    logger.info(`[${requestId}] User details retrieved successfully`, {
      userId,
      tenantId
    });

    return res.status(200).json({
      user: {
        ...user,
        roleName: role?.name || 'Unknown'
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Get user failed`, {
      userId: req.params.userId,
      tenantId: req.user?.tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const currentUserId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] User update request initiated`, {
    userId,
    tenantId,
    fieldsToUpdate: Object.keys(updates),
    isOwnProfile: userId === currentUserId
  });

  try {

    // Extract password for separate handling
    const { password, ...otherUpdates } = updates;

    // Don't allow updating critical fields
    delete otherUpdates.userId;
    delete otherUpdates.tenantId;
    delete otherUpdates.passwordHash;
    delete otherUpdates.passwordSalt;
    delete otherUpdates.resetPasswordToken;
    delete otherUpdates.resetPasswordExpires;
    delete otherUpdates.tokenVersion;

    const user = await User.findOne({ userId });

    if (!user) {
      logger.warn(`[${requestId}] User not found for update`, { userId, tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied: Tenant mismatch on update`, {
        userId,
        userTenantId: user.tenantId,
        requestTenantId: tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only update users from your own tenant.' });
    }

    // Check authorization
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    const isOwnProfile = user.userId === currentUserId;

    if (!isAdmin && !isOwnProfile) {
      logger.warn(`[${requestId}] Access denied: User tried to update another user`, {
        userId,
        currentUserId,
        isAdmin
      });
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    // Regular users cannot change their role or isActive status
    if (!isAdmin) {
      delete otherUpdates.roleId;
      delete otherUpdates.isActive;
      logger.debug(`[${requestId}] Restricted role/status changes for non-admin`, { userId, tenantId });
    }

    // Handle password change if provided
    if (password) {
      if (password.length < 6) {
        logger.warn(`[${requestId}] Password validation failed: too short`, { userId, tenantId });
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      otherUpdates.passwordHash = await bcrypt.hash(password, 10);
      logger.debug(`[${requestId}] Password will be updated`, { userId, tenantId });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: otherUpdates },
      { new: true, runValidators: true }
    ).select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion');

    // Get role name
    const role = await Role.findOne({ roleId: updatedUser?.roleId }).lean();

    logger.info(`[${requestId}] User updated successfully`, {
      userId,
      tenantId,
      updatedFields: Object.keys(otherUpdates).filter(k => k !== 'passwordHash')
    });

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        ...updatedUser?.toObject(),
        roleName: role?.name || 'Unknown'
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] User update failed`, {
      userId: req.params.userId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.params;
  const tenantId = req.user?.tenantId;
  const currentUserId = req.user?.userId;

  logger.info(`[${requestId}] User deletion request initiated`, {
    userId,
    tenantId,
    requestedBy: currentUserId
  });

  try {

    const user = await User.findOne({ userId });

    if (!user) {
      logger.warn(`[${requestId}] User not found for deletion`, { userId, tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied: Tenant mismatch on delete`, {
        userId,
        userTenantId: user.tenantId,
        requestTenantId: tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only delete users from your own tenant.' });
    }

    // Prevent users from deleting themselves
    if (user.userId === currentUserId) {
      logger.warn(`[${requestId}] User tried to delete their own account`, { userId, tenantId });
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await User.deleteOne({ userId });

    logger.info(`[${requestId}] User deleted successfully`, {
      userId,
      userEmail: user.email,
      tenantId
    });

    return res.status(200).json({
      message: 'User deleted successfully',
      userId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] User deletion failed`, {
      userId: req.params.userId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Password change request initiated`, { userId });

  try {
    if (!currentPassword || !newPassword) {
      logger.warn(`[${requestId}] Missing required fields for password change`, { userId, tenantId: req.user?.tenantId });
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      logger.warn(`[${requestId}] Password validation failed: too short`, { userId, tenantId: req.user?.tenantId });
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      logger.warn(`[${requestId}] User not found for password change`, { userId, tenantId: req.user?.tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if password is set
    if (!user.passwordHash) {
      logger.warn(`[${requestId}] No password set for user`, { userId, tenantId: req.user?.tenantId });
      return res.status(400).json({ message: 'No password set. Please activate your account first' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`[${requestId}] Password change failed: incorrect current password`, { userId, tenantId: req.user?.tenantId });
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and increment token version to invalidate existing tokens
    user.passwordHash = passwordHash;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    logger.info(`[${requestId}] Password changed successfully`, {
      userId,
      email: user.email,
      tokenVersion: user.tokenVersion
    });

    return res.status(200).json({
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Password change failed`, {
      userId: req.user?.userId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminResetPassword = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.params;
  const tenantId = req.user?.tenantId;
  const adminUserId = req.user?.userId;

  logger.info(`[${requestId}] Admin password reset request initiated`, {
    targetUserId: userId,
    adminUserId,
    tenantId
  });

  try {

    const user = await User.findOne({ userId });

    if (!user) {
      logger.warn(`[${requestId}] User not found for password reset`, { userId, tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied: Tenant mismatch on password reset`, {
        userId,
        userTenantId: user.tenantId,
        requestTenantId: tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only reset passwords for users in your tenant.' });
    }

    // Generate new temporary password (12 characters)
    const tempPassword = nanoid(12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update password and increment token version
    user.passwordHash = passwordHash;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    logger.info(`[${requestId}] Admin password reset completed`, {
      userId,
      email: user.email,
      resetBy: req.user?.userId,
      tenantId
    });

    return res.status(200).json({
      message: 'Password reset successfully',
      userId: user.userId,
      email: user.email,
      tempPassword // In production, send this via email and remove from response
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Admin password reset failed`, {
      userId: req.params.userId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const {
    email,
    password,
    firstName,
    lastName,
    roleId,
    isActive
  } = req.body;
  const tenantId = req.user?.tenantId;
  const currentUserId = req.user?.userId;

  logger.info(`[${requestId}] User creation request initiated`, {
    email,
    roleId,
    tenantId,
    createdBy: currentUserId
  });

  try {
    if (!email || !firstName || !lastName || !roleId) {
      logger.warn(`[${requestId}] Missing required fields for user creation`, {
        hasEmail: !!email,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasRoleId: !!roleId
      });
      return res.status(400).json({ message: 'Email, first name, last name, and role ID are required' });
    }

    if (!password) {
      logger.warn(`[${requestId}] Password missing for user creation`, { email, tenantId });
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      logger.warn(`[${requestId}] Password validation failed: too short`, { email, tenantId });
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in user creation request`, { tenantId });
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn(`[${requestId}] User creation failed: Email already exists`, {
        email: email.toLowerCase(),
        existingUserId: existingUser.userId
      });
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Verify role exists and belongs to the tenant or is global
    const role = await Role.findOne({
      roleId,
      $or: [{ tenantId: '-1' }, { tenantId }]
    });

    if (!role) {
      logger.warn(`[${requestId}] Invalid role ID provided`, { roleId, tenantId });
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    logger.debug(`[${requestId}] Creating user with role`, {
      roleId,
      roleName: role.name
    });

    // Hash the provided password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user_${nanoid()}`;
    const user = await User.create({
      userId,
      tenantId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      roleId,
      isActive: isActive ?? true
    });

    logger.info(`[${requestId}] User created successfully`, {
      userId: user.userId,
      email: user.email,
      roleId: user.roleId,
      tenantId,
      createdBy: currentUserId
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: role.name,
        tenantId: user.tenantId,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] User creation failed`, {
      email: req.body.email,
      tenantId: req.user?.tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId } = req.params;
  const { isActive } = req.body;
  const tenantId = req.user?.tenantId;
  const currentUserId = req.user?.userId;

  logger.info(`[${requestId}] Toggle user active status request`, {
    userId,
    newStatus: isActive,
    requestedBy: currentUserId,
    tenantId
  });

  try {
    if (typeof isActive !== 'boolean') {
      logger.warn(`[${requestId}] Invalid isActive value provided`, { isActive, tenantId });
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const user = await User.findOne({ userId, tenantId });

    if (!user) {
      logger.warn(`[${requestId}] User not found for status toggle`, { userId, tenantId });
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent users from deactivating themselves
    if (userId === currentUserId) {
      logger.warn(`[${requestId}] User tried to change their own active status`, { userId, tenantId });
      return res.status(400).json({ message: 'Cannot change your own active status' });
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    logger.info(`[${requestId}] User active status toggled successfully`, {
      userId,
      email: user.email,
      oldStatus,
      newStatus: isActive,
      changedBy: currentUserId,
      tenantId
    });

    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        userId: user.userId,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Toggle user active status failed`, {
      userId: req.params.userId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  adminResetPassword,
  createUser,
  toggleUserActive
};
