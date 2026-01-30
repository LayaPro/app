import { Response } from 'express';
import { nanoid } from 'nanoid';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import ProjectFinance from '../models/projectFinance';
import Event from '../models/event';
import Team from '../models/team';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Proposal from '../models/proposal';
import { AuthRequest } from '../middleware/auth';
import { generateBucketName, createS3Bucket, bucketExists } from '../utils/s3Bucket';

export const createProject = async (req: AuthRequest, res: Response) => {
  console.log('[Project] ========== CREATE PROJECT REQUEST RECEIVED ==========');
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
      proposalId,
      displayPic,
      coverPhoto
    } = req.body;
    const tenantId = req.user?.tenantId;
    
    console.log('[Project] Request data:', { projectName, tenantId, proposalId });

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectId = `project_${nanoid()}`;
    
    // Generate unique S3 bucket name from project name
    const s3BucketName = generateBucketName(projectName, tenantId);
    console.log(`[Project] Creating project ${projectId} with S3 bucket: ${s3BucketName}`);
    
    // Create S3 bucket
    try {
      console.log('[Project] Calling createS3Bucket...');
      await createS3Bucket(s3BucketName);
      console.log('[Project] S3 bucket created successfully');
    } catch (bucketError) {
      console.error('[Project] S3 bucket creation failed:', {
        projectId,
        projectName,
        s3BucketName,
        tenantId,
        error: bucketError instanceof Error ? bucketError.message : 'Unknown error',
        stack: bucketError instanceof Error ? bucketError.stack : undefined
      });
      return res.status(500).json({ 
        message: 'Failed to create S3 bucket for project',
        error: bucketError instanceof Error ? bucketError.message : 'Unknown error'
      });
    }
    
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
      proposalId,
      s3BucketName,
      displayPic,
      coverPhoto
    });

    // If project was created from a proposal, update the proposal status
    if (proposalId) {
      try {
        await Proposal.findOneAndUpdate(
          { proposalId, tenantId },
          { 
            status: 'project_created',
            updatedAt: new Date()
          }
        );
        console.log('[Project] Updated proposal status to project_created:', proposalId);
      } catch (proposalError) {
        console.error('[Project] Failed to update proposal status:', proposalError);
        // Don't fail the project creation if proposal update fails
      }
    }

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
    const userId = req.user?.userId;
    const roleName = req.user?.roleName;

    console.log('getAllProjects - User Info:', { userId, roleName, tenantId });

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'Admin';
    console.log('getAllProjects - isAdmin:', isAdmin);

    // For non-admin users, find their team member ID
    let memberId: string | undefined;
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (teamMember) {
        memberId = teamMember.memberId;
        console.log('getAllProjects - Team Member ID:', memberId);
      } else {
        console.log('getAllProjects - No team member found for user');
        // User is not a team member, return empty projects
        return res.status(200).json({
          message: 'Projects retrieved successfully',
          count: 0,
          projects: []
        });
      }
    }

    // Get all projects for the tenant
    const projects = await Project.find({ tenantId }).sort({ createdAt: -1 }).lean();
    console.log('getAllProjects - Total projects:', projects.length);

    // Fetch related events and finance for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        let clientEvents;
        
        if (isAdmin) {
          // Admin sees all events for the project
          clientEvents = await ClientEvent.find({ projectId: project.projectId }).lean();
        } else {
          // Non-admin users only see events where they are assigned as team members
          clientEvents = await ClientEvent.find({ 
            projectId: project.projectId,
            teamMembersAssigned: memberId 
          }).lean();
          
          // Debug: Check all events for this project
          const allProjectEvents = await ClientEvent.find({ projectId: project.projectId }).lean();
          if (allProjectEvents.length > 0) {
            console.log(`Project ${project.projectName}:`);
            allProjectEvents.forEach(event => {
              console.log(`  Event: ${event.clientEventId}, teamMembersAssigned:`, event.teamMembersAssigned);
            });
            console.log(`  Member ${memberId} is assigned to ${clientEvents.length} events`);
          }
        }

        const finance = await ProjectFinance.findOne({ projectId: project.projectId }).lean();
        
        // Get proposal for this project to retrieve access pin (using proposalId from project)
        let proposal = null;
        if (project.proposalId) {
          proposal = await Proposal.findOne({ proposalId: project.proposalId }).lean();
        }
        
        // Populate event descriptions
        const eventsWithDetails = await Promise.all(
          clientEvents.map(async (ce) => {
            const event = await Event.findOne({ eventId: ce.eventId }).lean();
            
            // Log if duration is missing to help debug
            if (ce.duration === undefined || ce.duration === null) {
              console.log(`Warning: Event ${ce.clientEventId} missing duration field`);
            }
            
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
          finance,
          accessPin: proposal?.accessPin || null,
          accessCode: proposal?.accessCode || null
        };
      })
    );

    // For non-admin users, filter out projects with no assigned events
    const filteredProjects = isAdmin 
      ? projectsWithDetails 
      : projectsWithDetails.filter(project => project.events.length > 0);

    console.log('getAllProjects - Filtered projects count:', filteredProjects.length);

    return res.status(200).json({
      message: 'Projects retrieved successfully',
      count: filteredProjects.length,
      projects: filteredProjects
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
  console.log('[ProjectWithDetails] ========== CREATE PROJECT WITH DETAILS REQUEST ==========');
  try {
    const { project: projectData, events, finance } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    console.log('[ProjectWithDetails] Request data:', { 
      projectName: projectData?.projectName, 
      tenantId,
      eventsCount: events?.length,
      hasFinance: !!finance
    });

    if (!projectData.projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const projectId = `project_${nanoid()}`;
    
    // Generate unique S3 bucket name from project name
    const s3BucketName = generateBucketName(projectData.projectName, tenantId);
    console.log(`[ProjectWithDetails] Creating project ${projectId} with S3 bucket: ${s3BucketName}`);
    
    // Create S3 bucket
    try {
      console.log('[ProjectWithDetails] Calling createS3Bucket...');
      await createS3Bucket(s3BucketName);
      console.log('[ProjectWithDetails] S3 bucket created successfully');
    } catch (bucketError) {
      console.error('[ProjectWithDetails] S3 bucket creation failed:', {
        projectId,
        projectName: projectData.projectName,
        s3BucketName,
        tenantId,
        error: bucketError instanceof Error ? bucketError.message : 'Unknown error',
        stack: bucketError instanceof Error ? bucketError.stack : undefined
      });
      return res.status(500).json({ 
        message: 'Failed to create S3 bucket for project',
        error: bucketError instanceof Error ? bucketError.message : 'Unknown error'
      });
    }
    
    // Create project
    const project = await Project.create({
      projectId,
      tenantId,
      projectName: projectData.projectName,
      contactPerson: projectData.contactPerson,
      email: projectData.email,
      brideFirstName: projectData.brideFirstName,
      groomFirstName: projectData.groomFirstName,
      brideLastName: projectData.brideLastName,
      groomLastName: projectData.groomLastName,
      phoneNumber: projectData.phoneNumber,
      budget: finance?.totalBudget,
      address: projectData.address,
      city: projectData.city,
      referredBy: projectData.referredBy,
      proposalId: projectData.proposalId,
      displayPic: projectData.displayPic,
      coverPhoto: projectData.coverPhoto,
      s3BucketName,
    });

    // If project was created from a proposal, update the proposal status
    if (projectData.proposalId) {
      try {
        await Proposal.findOneAndUpdate(
          { proposalId: projectData.proposalId, tenantId },
          { 
            status: 'project_created',
            updatedAt: new Date()
          }
        );
        console.log('[ProjectWithDetails] Updated proposal status to project_created:', projectData.proposalId);
      } catch (proposalError) {
        console.error('[ProjectWithDetails] Failed to update proposal status:', proposalError);
        // Don't fail the project creation if proposal update fails
      }
    }

    // Get SCHEDULED status for new events
    const scheduledStatus = await EventDeliveryStatus.findOne({
      tenantId,
      statusCode: 'SCHEDULED'
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
          eventDeliveryStatusId: scheduledStatus?.statusId,
          fromDatetime: eventData.fromDatetime,
          toDatetime: eventData.toDatetime,
          duration: eventData.duration,
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

    // Get SCHEDULED status for new events
    const scheduledStatus = await EventDeliveryStatus.findOne({
      tenantId,
      statusCode: 'SCHEDULED'
    });

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
          eventDeliveryStatusId: scheduledStatus?.statusId,
          fromDatetime: eventData.fromDatetime,
          toDatetime: eventData.toDatetime,
          duration: eventData.duration,
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