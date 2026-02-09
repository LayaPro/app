import { Response } from 'express';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Team from '../models/team';
import User from '../models/user';
import Role from '../models/role';
import Profile from '../models/profile';
import { AuthRequest } from '../middleware/auth';
import { sendActivationEmail } from '../services/emailService';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('TeamController');

export const createTeamMember = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const createdBy = req.user?.userId;

  logger.info(`[${requestId}] Team member creation request initiated`, {
    tenantId,
    createdBy,
    email: req.body.email,
    isFreelancer: req.body.isFreelancer
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      govtIdNumber,
      roleId,
      profileIds,
      address,
      isFreelancer,
      paymentType,
      salary
    } = req.body;

    if (!firstName || !lastName || !email) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Missing required fields`, {
        tenantId,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasEmail: !!email
      });
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Tenant ID missing in request`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if team member with same email exists for this tenant
    const existingTeamMember = await Team.findOne({ email: email.toLowerCase(), tenantId }).session(session);
    if (existingTeamMember) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Team member with email already exists`, {
        email: email.toLowerCase(),
        tenantId,
        existingMemberId: existingTeamMember.memberId
      });
      return res.status(409).json({ message: 'Team member with this email already exists for your tenant' });
    }

    // Check if user with same email exists (only if not a freelancer)
    if (!isFreelancer) {
      const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        logger.warn(`[${requestId}] User with email already exists`, {
          email: email.toLowerCase(),
          tenantId,
          existingUserId: existingUser.userId
        });
        return res.status(409).json({ message: 'User with this email already exists' });
      }
    }

    // Validate roleId (only required for non-freelancers who need login access)
    if (!isFreelancer) {
      if (!roleId) {
        await session.abortTransaction();
        session.endSession();
        logger.warn(`[${requestId}] Role ID missing for non-freelancer`, {
          email: email.toLowerCase(),
          tenantId
        });
        return res.status(400).json({ message: 'Access role is required for team members with login access' });
      }

      // Verify the role exists and user has access to it
      const role = await Role.findOne({ 
        roleId, 
        $or: [
          { tenantId: '-1' }, // Global roles
          { tenantId } // Tenant-specific roles
        ]
      }).session(session);
      
      if (!role) {
        await session.abortTransaction();
        session.endSession();
        logger.warn(`[${requestId}] Invalid role ID provided`, {
          roleId,
          tenantId
        });
        return res.status(400).json({ message: 'Invalid role selected' });
      }

      logger.debug(`[${requestId}] Role validated`, {
        roleId,
        roleName: role.name
      });
    }

    let userId = undefined;

    // Only create user account if NOT a freelancer
    if (!isFreelancer) {
      logger.debug(`[${requestId}] Creating user account for team member`, {
        email: email.toLowerCase(),
        tenantId
      });

      // Create user entry for login (without password initially)
      const newUserId = `user_${nanoid()}`;
      
      // Generate activation token (valid for 24 hours)
      const activationToken = crypto.randomBytes(32).toString('hex');
      const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');
      
      const [user] = await User.create([{
        userId: newUserId,
        tenantId,
        email: email.toLowerCase(),
        passwordHash: '', // Empty initially, will be set when user activates
        firstName,
        lastName,
        roleId,
        isActive: true,
        isActivated: false,
        activationToken: activationTokenHash,
        activationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }], { session });
      userId = user.userId;

      logger.info(`[${requestId}] User account created`, {
        userId,
        email: email.toLowerCase(),
        tenantId
      });

      // Send activation email
      try {
        logger.debug(`[${requestId}] Sending activation email`, {
          email: email.toLowerCase(),
          tenantId
        });
        await sendActivationEmail(email.toLowerCase(), `${firstName} ${lastName}`, activationToken);
        logger.info(`[${requestId}] Activation email sent successfully`, {
          email: email.toLowerCase(),
          tenantId
        });
      } catch (emailError: any) {
        logger.error(`[${requestId}] Failed to send activation email`, {
          email: email.toLowerCase(),
          tenantId,
          error: emailError.message
        });
        // Don't fail the whole operation if email fails
      }
    }

    // Create team member with linked userId (null for freelancers)
    const memberId = `member_${nanoid()}`;
    const [teamMember] = await Team.create([{
      memberId,
      tenantId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      govtIdNumber,
      roleId: isFreelancer ? undefined : roleId,
      profileIds: Array.isArray(profileIds) ? profileIds : [],
      userId,
      address,
      isFreelancer: isFreelancer || false,
      paymentType,
      salary
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    logger.info(`[${requestId}] Team member created successfully`, {
      memberId,
      email: email.toLowerCase(),
      tenantId,
      isFreelancer: isFreelancer || false,
      hasUserAccount: !!userId,
      createdBy
    });

    // Audit log for team member creation
    logAudit({
      action: auditEvents.USER_CREATED,
      entityType: 'TeamMember',
      entityId: memberId,
      tenantId,
      performedBy: createdBy,
      changes: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        isFreelancer: isFreelancer || false,
        roleId: isFreelancer ? null : roleId,
        userId: userId || null
      },
      metadata: {
        profileCount: Array.isArray(profileIds) ? profileIds.length : 0,
        hasUserAccount: !!userId
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: isFreelancer 
        ? 'Freelancer team member created successfully (no login access)' 
        : 'Team member created successfully. Activation link sent to email.',
      teamMember,
      ...(userId && {
        user: {
          userId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          roleId
        }
      })
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`[${requestId}] Team member creation failed`, {
      email: req.body.email,
      tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all team members`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in request`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Get all team members for this tenant
    const teamMembers = await Team.find({ tenantId }).sort({ createdAt: -1 }).lean();

    logger.debug(`[${requestId}] Found ${teamMembers.length} team members`);

    // Get all profile IDs from team members (both profileId and profileIds)
    const profileIdsSet = new Set<string>();
    teamMembers.forEach(member => {
      if (member.profileId) profileIdsSet.add(member.profileId);
      if (Array.isArray(member.profileIds)) {
        member.profileIds.forEach(id => profileIdsSet.add(id));
      }
    });
    const allProfileIds = Array.from(profileIdsSet);

    // Fetch all profiles in one query (include global profiles)
    const profiles = await Profile.find({ 
      profileId: { $in: allProfileIds },
      tenantId: { $in: [tenantId, -1] }
    }).lean();

    // Create a map for quick lookup
    const profileMap = new Map(
      profiles.map(profile => [profile.profileId, profile])
    );

    // Attach profile data to team members
    const teamMembersWithProfiles = teamMembers.map(member => ({
      ...member,
      profile: member.profileId ? profileMap.get(member.profileId) : null,
      profiles: Array.isArray(member.profileIds) 
        ? member.profileIds.map(id => profileMap.get(id)).filter(p => p != null)
        : []
    }));

    logger.info(`[${requestId}] Team members retrieved successfully`, {
      tenantId,
      count: teamMembersWithProfiles.length
    });

    return res.status(200).json({
      message: 'Team members retrieved successfully',
      count: teamMembersWithProfiles.length,
      teamMembers: teamMembersWithProfiles
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Get all team members failed`, {
      tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTeamMemberById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { memberId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching team member details`, {
    memberId,
    tenantId,
    requestedBy: userId
  });

  try {
    const teamMember = await Team.findOne({ memberId });

    if (!teamMember) {
      logger.warn(`[${requestId}] Team member not found`, { memberId, tenantId });
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization based on role
    const isAdmin = roleName === 'Admin';
    
    if (isAdmin) {
      // Admin can see any member in their tenant
      if (teamMember.tenantId !== tenantId) {
        logger.warn(`[${requestId}] Access denied: Tenant mismatch`, {
          memberId,
          memberTenantId: teamMember.tenantId,
          requestTenantId: tenantId
        });
        return res.status(403).json({ message: 'Access denied. You can only view your own tenant team members.' });
      }
    } else {
      // Regular users can only see their own data
      if (teamMember.userId !== userId) {
        logger.warn(`[${requestId}] Access denied: User tried to view another member`, {
          memberId,
          requestedBy: userId,
          memberUserId: teamMember.userId
        });
        return res.status(403).json({ message: 'Access denied. You can only view your own data.' });
      }
    }

    logger.info(`[${requestId}] Team member details retrieved successfully`, {
      memberId,
      tenantId
    });

    return res.status(200).json({ teamMember });
  } catch (err: any) {
    logger.error(`[${requestId}] Get team member failed`, {
      memberId,
      tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTeamMember = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { memberId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Team member update request initiated`, {
    memberId,
    tenantId,
    fieldsToUpdate: Object.keys(updates),
    requestedBy: userId
  });

  try {
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
      logger.warn(`[${requestId}] Team member not found for update`, { memberId, tenantId });
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization based on role
    const isAdmin = roleName === 'Admin';
    
    if (isAdmin) {
      // Admin can update any member in their tenant
      if (teamMember.tenantId !== tenantId) {
        logger.warn(`[${requestId}] Access denied: Tenant mismatch on update`, {
          memberId,
          memberTenantId: teamMember.tenantId,
          requestTenantId: tenantId
        });
        return res.status(403).json({ message: 'Access denied. You can only update your own tenant team members.' });
      }
    } else {
      // Regular users can only update their own data
      if (teamMember.userId !== userId) {
        logger.warn(`[${requestId}] Access denied: User tried to update another member`, {
          memberId,
          requestedBy: userId,
          memberUserId: teamMember.userId
        });
        return res.status(403).json({ message: 'Access denied. You can only update your own data.' });
      }
    }

    const updatedTeamMember = await Team.findOneAndUpdate(
      { memberId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Team member updated successfully`, {
      memberId,
      tenantId,
      updatedFields: Object.keys(updates),
      updatedBy: userId
    });

    // Audit log for team member update
    logAudit({
      action: auditEvents.USER_UPDATED,
      entityType: 'TeamMember',
      entityId: memberId,
      tenantId,
      performedBy: userId,
      changes: updates,
      metadata: {
        memberEmail: teamMember.email,
        isFreelancer: teamMember.isFreelancer
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Team member updated successfully',
      teamMember: updatedTeamMember
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Team member update failed`, {
      memberId,
      tenantId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { memberId } = req.params;
  const tenantId = req.user?.tenantId;
  const deletedBy = req.user?.userId;

  logger.info(`[${requestId}] Team member deletion request initiated`, {
    memberId,
    tenantId,
    requestedBy: deletedBy
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const teamMember = await Team.findOne({ memberId }).session(session);

    if (!teamMember) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Team member not found for deletion`, { memberId, tenantId });
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Check authorization: all users can only delete their own tenant's members
    if (teamMember.tenantId !== tenantId) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`[${requestId}] Access denied: Tenant mismatch on delete`, {
        memberId,
        memberTenantId: teamMember.tenantId,
        requestTenantId: tenantId
      });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant team members.' });
    }

    // Delete associated user account if exists
    if (teamMember.userId) {
      logger.debug(`[${requestId}] Deleting associated user account`, {
        userId: teamMember.userId,
        tenantId
      });
      await User.deleteOne({ userId: teamMember.userId }).session(session);
    }

    // Delete team member
    await Team.deleteOne({ memberId }).session(session);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    logger.info(`[${requestId}] Team member deleted successfully`, {
      memberId,
      email: teamMember.email,
      tenantId,
      hadUserAccount: !!teamMember.userId,
      deletedBy
    });

    // Audit log for team member deletion
    logAudit({
      action: auditEvents.USER_DELETED,
      entityType: 'TeamMember',
      entityId: memberId,
      tenantId,
      performedBy: deletedBy,
      changes: {
        deleted: true,
        email: teamMember.email,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName
      },
      metadata: {
        isFreelancer: teamMember.isFreelancer,
        hadUserAccount: !!teamMember.userId,
        userId: teamMember.userId
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Team member and associated user account deleted successfully',
      memberId
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`[${requestId}] Team member deletion failed`, {
      memberId,
      tenantId,
      error: err.message,
      stack: err.stack
    });
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
