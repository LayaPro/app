import { Response } from 'express';
import { nanoid } from 'nanoid';
import Project from '../models/project';
import { AuthRequest } from '../middleware/auth';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectName,
      brideFirstName,
      groomFirstName,
      brideLastName,
      groomLastName,
      phoneNumber,
      budget,
      address,
      referredBy,
      projectDeliveryStatusId,
      displayPic,
      coverPhoto
    } = req.body;
    const tenantId = req.user?.tenantId;

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectId = `project_${nanoid()}`;
    
    // Generate S3-compliant bucket name from projectId
    // S3 rules: lowercase, numbers, hyphens only, 3-63 chars, start/end with letter/number
    const s3BucketName = `laya-${tenantId.toLowerCase()}-${projectId.toLowerCase()}`;
    
    const project = await Project.create({
      projectId,
      tenantId,
      projectName,
      brideFirstName,
      groomFirstName,
      brideLastName,
      groomLastName,
      phoneNumber,
      budget,
      address,
      referredBy,
      projectDeliveryStatusId,
      s3BucketName,
      displayPic,
      coverPhoto
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (err: any) {
    console.error('Create project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProjects = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // All users (including superadmin) only see their own tenant's projects
    const projects = await Project.find({ tenantId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: 'Projects retrieved successfully',
      count: projects.length,
      projects
    });
  } catch (err: any) {
    console.error('Get all projects error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only access their own tenant's projects
    if (project.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant projects.' });
    }

    return res.status(200).json({ project });
  } catch (err: any) {
    console.error('Get project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;

    // Don't allow updating projectId or tenantId
    delete updates.projectId;
    delete updates.tenantId;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only update their own tenant's projects
    if (project.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant projects.' });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { projectId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (err: any) {
    console.error('Update project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user?.tenantId;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only delete their own tenant's projects
    if (project.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant projects.' });
    }

    await Project.deleteOne({ projectId });

    return res.status(200).json({
      message: 'Project deleted successfully',
      projectId
    });
  } catch (err: any) {
    console.error('Delete project error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
};
