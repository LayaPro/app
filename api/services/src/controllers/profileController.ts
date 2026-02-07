import { Response } from 'express';
import { nanoid } from 'nanoid';
import Profile from '../models/profile';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('ProfileController');

export const createProfile = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { name, description } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating profile`, { tenantId, name });

  try {
    if (!name) {
      logger.warn(`[${requestId}] Profile name missing`, { tenantId });
      return res.status(400).json({ message: 'Profile name is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if profile with same name exists for this tenant
    const existing = await Profile.findOne({ name, tenantId });
    if (existing) {
      logger.warn(`[${requestId}] Duplicate profile name`, { tenantId, name });
      return res.status(409).json({ message: 'Profile with this name already exists for your tenant' });
    }

    const profileId = `profile_${nanoid()}`;
    const profile = await Profile.create({
      profileId,
      tenantId,
      name,
      description
    });

    logger.info(`[${requestId}] Profile created`, { tenantId, profileId, name });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Profile',
      entityId: profileId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: {
        name,
        description
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating profile`, { 
      tenantId, 
      name,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProfiles = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching all profiles`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Include both global profiles (tenantId: -1) and tenant-specific profiles
    const profiles = await Profile.find({ tenantId: { $in: [tenantId, -1] } }).sort({ createdAt: -1 }).lean();

    logger.info(`[${requestId}] Profiles retrieved`, { tenantId, count: profiles.length });

    return res.status(200).json({
      message: 'Profiles retrieved successfully',
      count: profiles.length,
      profiles
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching profiles`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfileById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { profileId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching profile`, { tenantId, profileId });

  try {
    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      logger.warn(`[${requestId}] Profile not found`, { tenantId, profileId });
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only access their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, profileId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant profiles.' });
    }

    logger.info(`[${requestId}] Profile retrieved`, { tenantId, profileId });

    return res.status(200).json({ profile });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching profile`, { 
      tenantId, 
      profileId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { profileId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating profile`, { tenantId, profileId });

  try {
    // Don't allow updating profileId or tenantId
    delete updates.profileId;
    delete updates.tenantId;

    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      logger.warn(`[${requestId}] Profile not found`, { tenantId, profileId });
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only update their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, profileId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant profiles.' });
    }

    // Track changes for audit
    const changes: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && (profile as any)[key] !== updates[key]) {
        changes[key] = { before: (profile as any)[key], after: updates[key] };
      }
    });

    const updatedProfile = await Profile.findOneAndUpdate(
      { profileId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Profile updated`, { tenantId, profileId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Profile',
      entityId: profileId,
      tenantId,
      performedBy: userId || 'System',
      changes,
      metadata: {
        name: profile.name
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating profile`, { 
      tenantId, 
      profileId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { profileId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting profile`, { tenantId, profileId });

  try {
    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      logger.warn(`[${requestId}] Profile not found`, { tenantId, profileId });
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only delete their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, profileId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant profiles.' });
    }

    // Store data for audit
    const profileData = {
      name: profile.name,
      description: profile.description
    };

    await Profile.deleteOne({ profileId });

    logger.info(`[${requestId}] Profile deleted`, { tenantId, profileId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'Profile',
      entityId: profileId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: profileData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Profile deleted successfully',
      profileId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting profile`, { 
      tenantId, 
      profileId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createProfile,
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteProfile
};
