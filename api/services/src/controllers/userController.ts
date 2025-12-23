import { Response } from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import User from '../models/user';
import Role from '../models/role';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all users for the tenant (excluding password fields)
    const users = await User.find({ tenantId })
      .select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion')
      .sort({ createdAt: -1 })
      .lean();

    // Populate role names
    const userIds = users.map(u => u.roleId);
    const roles = await Role.find({ roleId: { $in: userIds } }).lean();
    const roleMap = new Map(roles.map(r => [r.roleId, r.name]));

    const usersWithRoles = users.map(user => ({
      ...user,
      roleName: roleMap.get(user.roleId) || 'Unknown'
    }));

    return res.status(200).json({
      message: 'Users retrieved successfully',
      count: usersWithRoles.length,
      users: usersWithRoles
    });
  } catch (err: any) {
    console.error('Get all users error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.userId;
    const roleName = req.user?.roleName;

    const user = await User.findOne({ userId })
      .select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization: admin/superadmin can view all users in tenant, regular users can only view themselves
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    if (!isAdmin && user.userId !== currentUserId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view users from your own tenant.' });
    }

    // Get role name
    const role = await Role.findOne({ roleId: user.roleId }).lean();

    return res.status(200).json({
      user: {
        ...user,
        roleName: role?.name || 'Unknown'
      }
    });
  } catch (err: any) {
    console.error('Get user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.userId;
    const roleName = req.user?.roleName;

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
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update users from your own tenant.' });
    }

    // Check authorization
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    const isOwnProfile = user.userId === currentUserId;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    // Regular users cannot change their role or isActive status
    if (!isAdmin) {
      delete otherUpdates.roleId;
      delete otherUpdates.isActive;
    }

    // Handle password change if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      otherUpdates.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: otherUpdates },
      { new: true, runValidators: true }
    ).select('-passwordHash -passwordSalt -resetPasswordToken -resetPasswordExpires -tokenVersion');

    // Get role name
    const role = await Role.findOne({ roleId: updatedUser?.roleId }).lean();

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        ...updatedUser?.toObject(),
        roleName: role?.name || 'Unknown'
      }
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.userId;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete users from your own tenant.' });
    }

    // Prevent users from deleting themselves
    if (user.userId === currentUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await User.deleteOne({ userId });

    return res.status(200).json({
      message: 'User deleted successfully',
      userId
    });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and increment token version to invalidate existing tokens
    user.passwordHash = passwordHash;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.status(200).json({
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminResetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user?.tenantId;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check tenant match
    if (user.tenantId !== tenantId) {
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

    return res.status(200).json({
      message: 'Password reset successfully',
      userId: user.userId,
      email: user.email,
      tempPassword // In production, send this via email and remove from response
    });
  } catch (err: any) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
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

    if (!email || !firstName || !lastName || !roleId) {
      return res.status(400).json({ message: 'Email, first name, last name, and role ID are required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Verify role exists and belongs to the tenant or is global
    const role = await Role.findOne({
      roleId,
      $or: [{ tenantId: '-1' }, { tenantId }]
    });

    if (!role) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

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
    console.error('Create user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.userId;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const user = await User.findOne({ userId, tenantId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent users from deactivating themselves
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot change your own active status' });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        userId: user.userId,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    console.error('Toggle user active error:', err);
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
