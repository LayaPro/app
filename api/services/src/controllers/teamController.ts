import { Response } from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import Team from '../models/team';
import User from '../models/user';
import Role from '../models/role';
import Profile from '../models/profile';
import { AuthRequest } from '../middleware/auth';

export const createTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      profileId,
      address,
      isFreelancer
    } = req.body;
    const tenantId = req.user?.tenantId;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if team member with same email exists for this tenant
    const existingTeamMember = await Team.findOne({ email: email.toLowerCase(), tenantId });
    if (existingTeamMember) {
      return res.status(409).json({ message: 'Team member with this email already exists for your tenant' });
    }

    // Check if user with same email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Get or create default "user" role for team members
    let userRole = await Role.findOne({ name: 'user', tenantId });
    if (!userRole) {
      const roleId = `role_${nanoid()}`;
      userRole = await Role.create({
        roleId,
        tenantId,
        name: 'user',
        description: 'Default role for team members'
      });
    }

    // Generate random password for the team member (12 characters)
    const generatedPassword = nanoid(12);
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Create user entry for login
    const userId = `user_${nanoid()}`;
    const user = await User.create({
      userId,
      tenantId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      roleId: userRole.roleId,
      isActive: true
    });

    // Create team member with linked userId
    const memberId = `member_${nanoid()}`;
    const teamMember = await Team.create({
      memberId,
      tenantId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      profileId,
      userId: user.userId,
      address,
      isFreelancer: isFreelancer || false
    });

    return res.status(201).json({
      message: 'Team member and user account created successfully',
      teamMember,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        tempPassword: generatedPassword // Send this via email later, remove from response in production
      }
    });
  } catch (err: any) {
    console.error('Create team member error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all team members for this tenant
    const teamMembers = await Team.find({ tenantId }).sort({ createdAt: -1 }).lean();

    // Get all profile IDs from team members
    const profileIds = teamMembers
      .map(member => member.profileId)
      .filter(id => id != null);

    // Fetch all profiles in one query
    const profiles = await Profile.find({ 
      profileId: { $in: profileIds },
      tenantId 
    }).lean();

    // Create a map for quick lookup
    const profileMap = new Map(
      profiles.map(profile => [profile.profileId, profile])
    );

    // Attach profile data to team members
    const teamMembersWithProfiles = teamMembers.map(member => ({
      ...member,
      profile: member.profileId ? profileMap.get(member.profileId) : null
    }));

    return res.status(200).json({
      message: 'Team members retrieved successfully',
      count: teamMembersWithProfiles.length,
      teamMembers: teamMembersWithProfiles
    });
  } catch (err: any) {
    console.error('Get all team members error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeamMemberById = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    const teamMember = await Team.findOne({ memberId });

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization based on role
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    
    if (isAdmin) {
      // Admin/superadmin can see any member in their tenant
      if (teamMember.tenantId !== tenantId) {
        return res.status(403).json({ message: 'Access denied. You can only view your own tenant team members.' });
      }
    } else {
      // Regular users can only see their own data
      if (teamMember.userId !== userId) {
        return res.status(403).json({ message: 'Access denied. You can only view your own data.' });
      }
    }

    return res.status(200).json({ teamMember });
  } catch (err: any) {
    console.error('Get team member error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    // Don't allow updating memberId or tenantId
    delete updates.memberId;
    delete updates.tenantId;
    delete updates.userId; // Don't allow changing userId

    // Lowercase email if provided
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }

    const teamMember = await Team.findOne({ memberId });

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization based on role
    const isAdmin = roleName === 'admin' || roleName === 'superadmin';
    
    if (isAdmin) {
      // Admin/superadmin can update any member in their tenant
      if (teamMember.tenantId !== tenantId) {
        return res.status(403).json({ message: 'Access denied. You can only update your own tenant team members.' });
      }
    } else {
      // Regular users can only update their own data
      if (teamMember.userId !== userId) {
        return res.status(403).json({ message: 'Access denied. You can only update your own data.' });
      }
    }

    const updatedTeamMember = await Team.findOneAndUpdate(
      { memberId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Team member updated successfully',
      teamMember: updatedTeamMember
    });
  } catch (err: any) {
    console.error('Update team member error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const tenantId = req.user?.tenantId;

    const teamMember = await Team.findOne({ memberId });

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization: all users can only delete their own tenant's members
    if (teamMember.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant team members.' });
    }

    // Delete associated user account if exists
    if (teamMember.userId) {
      await User.deleteOne({ userId: teamMember.userId });
    }

    // Delete team member
    await Team.deleteOne({ memberId });

    return res.status(200).json({
      message: 'Team member and associated user account deleted successfully',
      memberId
    });
  } catch (err: any) {
    console.error('Delete team member error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createTeamMember,
  getAllTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember
};
