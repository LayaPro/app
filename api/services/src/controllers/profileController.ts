import { Response } from 'express';
import { nanoid } from 'nanoid';
import Profile from '../models/profile';
import { AuthRequest } from '../middleware/auth';

export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;

    if (!name) {
      return res.status(400).json({ message: 'Profile name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Check if profile with same name exists for this tenant
    const existing = await Profile.findOne({ name, tenantId });
    if (existing) {
      return res.status(409).json({ message: 'Profile with this name already exists for your tenant' });
    }

    const profileId = `profile_${nanoid()}`;
    const profile = await Profile.create({
      profileId,
      tenantId,
      name,
      description
    });

    return res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (err: any) {
    console.error('Create profile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users (including superadmin) only see their own tenant's profiles
    const profiles = await Profile.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Profiles retrieved successfully',
      count: profiles.length,
      profiles
    });
  } catch (err: any) {
    console.error('Get all profiles error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfileById = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const tenantId = req.user?.tenantId;

    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only access their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant profiles.' });
    }

    return res.status(200).json({ profile });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating profileId or tenantId
    delete updates.profileId;
    delete updates.tenantId;

    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only update their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant profiles.' });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { profileId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const tenantId = req.user?.tenantId;

    const profile = await Profile.findOne({ profileId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check authorization: all users can only delete their own tenant's profiles
    if (profile.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant profiles.' });
    }

    await Profile.deleteOne({ profileId });

    return res.status(200).json({
      message: 'Profile deleted successfully',
      profileId
    });
  } catch (err: any) {
    console.error('Delete profile error:', err);
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
