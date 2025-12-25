import { Response } from 'express';
import { nanoid } from 'nanoid';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import ProjectFinance from '../models/projectFinance';
import Event from '../models/event';
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

    // Get all projects for the tenant
    const projects = await Project.find({ tenantId }).sort({ createdAt: -1 }).lean();

    // Fetch related events and finance for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const clientEvents = await ClientEvent.find({ projectId: project.projectId }).lean();
        const finance = await ProjectFinance.findOne({ projectId: project.projectId }).lean();
        
        // Populate event descriptions
        const eventsWithDetails = await Promise.all(
          clientEvents.map(async (ce) => {
            const event = await Event.findOne({ eventId: ce.eventId }).lean();
            console.log('Event lookup:', { eventId: ce.eventId, found: !!event, eventDesc: event?.eventDesc });
            return {
              ...ce,
              eventTitle: event?.eventDesc || null,
              eventCode: event?.eventCode || null
            };
          })
        );
        
        return {
          ...project,
          events: eventsWithDetails,
          finance
        };
      })
    );

    return res.status(200).json({
      message: 'Projects retrieved successfully',
      count: projectsWithDetails.length,
      projects: projectsWithDetails
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

export const createProjectWithDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { project: projectData, events, finance } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!projectData.projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectId = `project_${nanoid()}`;
    const s3BucketName = `laya-${tenantId.toLowerCase()}-${projectId.toLowerCase()}`;
    
    // Create project
    const project = await Project.create({
      projectId,
      tenantId,
      projectName: projectData.projectName,
      brideFirstName: projectData.brideFirstName,
      groomFirstName: projectData.groomFirstName,
      brideLastName: projectData.brideLastName,
      groomLastName: projectData.groomLastName,
      phoneNumber: projectData.phoneNumber,
      budget: finance?.totalBudget,
      address: projectData.address,
      referredBy: projectData.referredBy,
      displayPic: projectData.displayPic,
      coverPhoto: projectData.coverPhoto,
      s3BucketName,
    });

    // Create events if provided
    const createdEvents = [];
    if (events && events.length > 0) {
      for (const eventData of events) {
        const clientEventId = `clientevent_${nanoid()}`;
        const clientEvent = await ClientEvent.create({
          clientEventId,
          tenantId,
          projectId,
          eventId: eventData.eventId,
          fromDatetime: eventData.fromDatetime,
          toDatetime: eventData.toDatetime,
          venue: eventData.venue,
          venueMapUrl: eventData.venueMapUrl,
          city: eventData.city,
          teamMembersAssigned: eventData.teamMembersAssigned || [],
          createdBy: userId,
        });
        createdEvents.push(clientEvent);
      }
    }

    // Create finance record if provided
    let projectFinance = null;
    if (finance) {
      const financeId = `finance_${nanoid()}`;
      projectFinance = await ProjectFinance.create({
        financeId,
        tenantId,
        projectId,
        totalBudget: finance.totalBudget,
        receivedAmount: finance.receivedAmount,
        receivedDate: finance.receivedDate,
        nextDueDate: finance.nextDueDate,
        createdBy: userId,
      });
    }

    return res.status(201).json({
      message: 'Project created successfully',
      project,
      events: createdEvents,
      finance: projectFinance,
    });
  } catch (err: any) {
    console.error('Create project with details error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export const updateProjectWithDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { project: projectData, events, finance } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    // Find existing project
    const existingProject = await Project.findOne({ projectId });
    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    if (existingProject.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update project
    const updatedProject = await Project.findOneAndUpdate(
      { projectId },
      { $set: projectData },
      { new: true, runValidators: true }
    );

    // Delete existing events and create new ones
    if (events) {
      await ClientEvent.deleteMany({ projectId });
      const createdEvents = [];
      for (const eventData of events) {
        const clientEventId = `clientevent_${nanoid()}`;
        const clientEvent = await ClientEvent.create({
          clientEventId,
          tenantId,
          projectId,
          eventId: eventData.eventId,
          fromDatetime: eventData.fromDatetime,
          toDatetime: eventData.toDatetime,
          venue: eventData.venue,
          venueMapUrl: eventData.venueMapUrl,
          city: eventData.city,
          teamMembersAssigned: eventData.teamMembersAssigned || [],
          updatedBy: userId,
        });
        createdEvents.push(clientEvent);
      }
    }

    // Update or create finance
    let projectFinance = null;
    if (finance) {
      projectFinance = await ProjectFinance.findOne({ projectId });
      if (projectFinance) {
        projectFinance = await ProjectFinance.findOneAndUpdate(
          { projectId },
          { $set: finance },
          { new: true, runValidators: true }
        );
      } else {
        const financeId = `finance_${nanoid()}`;
        projectFinance = await ProjectFinance.create({
          financeId,
          tenantId,
          projectId,
          ...finance,
          createdBy: userId,
        });
      }
    }

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
      finance: projectFinance,
    });
  } catch (err: any) {
    console.error('Update project with details error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export default {
  createProject,
  createProjectWithDetails,
  getAllProjects,
  getProjectById,
  updateProject,
  updateProjectWithDetails,  deleteProject
};