import { Response } from 'express';
import { nanoid } from 'nanoid';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import ProjectFinance from '../models/projectFinance';
import Event from '../models/event';
import Team from '../models/team';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Proposal from '../models/proposal';
import Tenant from '../models/tenant';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

import { NotificationUtils } from '../services/notificationUtils';

const logger = createModuleLogger('ProjectController');

export const createProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
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
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating project`, { tenantId, projectName, proposalId });

  try {
    if (!projectName) {
      logger.warn(`[${requestId}] Project name missing`, { tenantId });
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Fetch tenant to get company name
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const projectId = `project_${nanoid()}`;
    
    // Generate unique S3 folder identifier: guid_projectname_tenantname
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const sanitizedTenantName = (tenant.tenantCompanyName || `${tenant.tenantFirstName}${tenant.tenantLastName}`)
      .replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const s3ProjectFolderName = `${nanoid(10)}_${sanitizedProjectName}_${sanitizedTenantName}`;
    
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
      s3ProjectFolderName,
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
        logger.info(`[${requestId}] Updated proposal status to project_created`, { tenantId, proposalId });
      } catch (proposalError: any) {
        logger.error(`[${requestId}] Failed to update proposal status`, { tenantId, proposalId, error: proposalError.message });
        // Don't fail the project creation if proposal update fails
      }
    }

    logger.info(`[${requestId}] Project created`, { tenantId, projectId, projectName });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Project',
      entityId: projectId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: {
        projectName,
        proposalId,
        s3ProjectFolderName
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating project`, { 
      tenantId, 
      projectName,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProjects = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  const roleName = req.user?.roleName;

  logger.info(`[${requestId}] Fetching all projects`, { tenantId, userId, roleName });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const isAdmin = roleName === 'Admin';

    // For non-admin users, find their team member ID
    let memberId: string | undefined;
    if (!isAdmin) {
      const teamMember = await Team.findOne({ userId, tenantId }).lean();
      if (teamMember) {
        memberId = teamMember.memberId;
      }
    }

    // Get all projects for the tenant
    const projects = await Project.find({ tenantId }).sort({ createdAt: -1 }).lean();

    // Fetch related events and finance for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        let clientEvents;
        
        if (isAdmin) {
          // Admin sees all events for the project
          clientEvents = await ClientEvent.find({ projectId: project.projectId }).lean();
        } else {
          // Non-admin users see events where they are:
          // 1. Assigned as team members, OR
          // 2. Assigned as album editor (by userId or memberId), OR
          // 3. Assigned as album designer (by userId or memberId)
          const query: any = {
            projectId: project.projectId,
            $or: [
              { albumEditor: userId },
              { albumDesigner: userId }
            ]
          };
          
          // Add conditions for memberId if user is a team member
          if (memberId) {
            query.$or.push({ teamMembersAssigned: memberId });
            query.$or.push({ albumEditor: memberId });
            query.$or.push({ albumDesigner: memberId });
          }
          
          clientEvents = await ClientEvent.find(query).lean();
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

    logger.info(`[${requestId}] Projects retrieved`, { tenantId, count: filteredProjects.length, isAdmin });

    return res.status(200).json({
      message: 'Projects retrieved successfully',
      count: filteredProjects.length,
      projects: filteredProjects
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching projects`, { 
      tenantId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;

  logger.info(`[${requestId}] Fetching project`, { tenantId, projectId });

  try {
    const project = await Project.findOne({ projectId });

    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only access their own tenant's projects
    if (project.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, projectId });
      return res.status(403).json({ message: 'Access denied. You can only view your own tenant projects.' });
    }

    logger.info(`[${requestId}] Project retrieved`, { tenantId, projectId });

    return res.status(200).json({ project });
  } catch (err: any) {
    logger.error(`[${requestId}] Error fetching project`, { 
      tenantId, 
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const updates = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating project`, { tenantId, projectId });

  try {
    // Don't allow updating projectId or tenantId
    delete updates.projectId;
    delete updates.tenantId;

    const project = await Project.findOne({ projectId });

    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only update their own tenant's projects
    if (project.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, projectId });
      return res.status(403).json({ message: 'Access denied. You can only update your own tenant projects.' });
    }

    // Track changes for audit
    const changes: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && (project as any)[key] !== updates[key]) {
        changes[key] = { before: (project as any)[key], after: updates[key] };
      }
    });

    const updatedProject = await Project.findOneAndUpdate(
      { projectId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`[${requestId}] Project updated`, { tenantId, projectId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Project',
      entityId: projectId,
      tenantId,
      performedBy: userId || 'System',
      changes,
      metadata: {
        projectName: project.projectName
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating project`, { 
      tenantId, 
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Deleting project`, { tenantId, projectId });

  try {
    const project = await Project.findOne({ projectId });

    if (!project) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization: all users can only delete their own tenant's projects
    if (project.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, projectId });
      return res.status(403).json({ message: 'Access denied. You can only delete your own tenant projects.' });
    }

    // Store data for audit
    const projectData = {
      projectName: project.projectName,
      s3ProjectFolderName: project.s3ProjectFolderName
    };

    await Project.deleteOne({ projectId });

    logger.info(`[${requestId}] Project deleted`, { tenantId, projectId });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_DELETED,
      entityType: 'Project',
      entityId: projectId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: projectData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Project deleted successfully',
      projectId
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error deleting project`, { 
      tenantId, 
      projectId,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProjectWithDetails = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { project: projectData, events, finance } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Creating project with details`, { 
    tenantId, 
    projectName: projectData?.projectName,
    eventsCount: events?.length,
    hasFinance: !!finance
  });

  try {
    if (!projectData.projectName) {
      logger.warn(`[${requestId}] Project name missing`, { tenantId });
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing`);
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Fetch tenant to get company name
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      logger.warn(`[${requestId}] Tenant not found`, { tenantId });
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const projectId = `project_${nanoid()}`;
    
    // Generate unique S3 folder identifier: guid_projectname_tenantname
    const sanitizedProjectName = projectData.projectName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const sanitizedTenantName = (tenant.tenantCompanyName || `${tenant.tenantFirstName}${tenant.tenantLastName}`)
      .replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const s3ProjectFolderName = `${nanoid(10)}_${sanitizedProjectName}_${sanitizedTenantName}`;
    
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
      s3ProjectFolderName,
      displayPic: projectData.displayPic,
      coverPhoto: projectData.coverPhoto,
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
        logger.info(`[${requestId}] Updated proposal status to project_created`, { tenantId, proposalId: projectData.proposalId });
      } catch (proposalError: any) {
        logger.error(`[${requestId}] Failed to update proposal status`, { tenantId, proposalId: projectData.proposalId, error: proposalError.message });
        // Don't fail the project creation if proposal update fails
      }
    }

    // Get event delivery statuses
    const scheduledStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'SCHEDULED'
    });
    const shootInProgressStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'SHOOT_IN_PROGRESS'
    });
    const awaitingEditingStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'AWAITING_EDITING'
    });

    // Create events if provided
    const createdEvents = [];
    if (events && events.length > 0) {
      const now = new Date();
      
      for (const eventData of events) {
        const clientEventId = `clientevent_${nanoid()}`;
        
        // Determine the correct status based on datetime
        let statusId = scheduledStatus?.statusId;
        const fromDatetime = new Date(eventData.fromDatetime);
        const toDatetime = new Date(eventData.toDatetime);
        
        if (toDatetime <= now) {
          // Event has ended
          statusId = awaitingEditingStatus?.statusId || scheduledStatus?.statusId;
        } else if (fromDatetime <= now && toDatetime > now) {
          // Event is currently in progress
          statusId = shootInProgressStatus?.statusId || scheduledStatus?.statusId;
        }
        // else: Event hasn't started yet, keep SCHEDULED
        
        // Fetch event master data to get event name
        const eventMaster = await Event.findOne({ 
          eventId: eventData.eventId,
          tenantId: { $in: [tenantId, -1] }
        });
        
        // Generate S3 folder name from event description
        const s3EventFolderName = eventMaster?.eventDesc.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'event';
        
        const clientEvent = await ClientEvent.create({
          clientEventId,
          tenantId,
          projectId,
          eventId: eventData.eventId,
          eventDeliveryStatusId: statusId,
          fromDatetime: eventData.fromDatetime,
          toDatetime: eventData.toDatetime,
          duration: eventData.duration,
          venue: eventData.venue,
          venueMapUrl: eventData.venueMapUrl,
          city: eventData.city,
          teamMembersAssigned: eventData.teamMembersAssigned || [],
          s3EventFolderName,
          createdBy: userId,
        });
        createdEvents.push(clientEvent);

        // If event was created with AWAITING_EDITING status and no editor, notify admins
        if (statusId === awaitingEditingStatus?.statusId && !clientEvent.albumEditor) {
          await NotificationUtils.notifyAssignEditorNeeded(
            clientEvent,
            projectData.projectName
          );
        }
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

    logger.info(`[${requestId}] Project with details created`, { 
      tenantId, 
      projectId,
      projectName: projectData.projectName,
      eventsCreated: createdEvents.length,
      financeCreated: !!projectFinance
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Project',
      entityId: projectId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: {
        projectName: projectData.projectName,
        s3ProjectFolderName,
        eventsCount: createdEvents.length,
        hasFinance: !!projectFinance
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project,
      events: createdEvents,
      finance: projectFinance,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error creating project with details`, { 
      tenantId,
      projectName: projectData?.projectName,
      error: err.message,
      stack: err.stack 
    });
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export const updateProjectWithDetails = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { projectId } = req.params;
  const { project: projectData, events, finance } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;

  logger.info(`[${requestId}] Updating project with details`, { 
    tenantId, 
    projectId,
    eventsCount: events?.length,
    hasFinance: !!finance
  });

  try {
    // Find existing project
    const existingProject = await Project.findOne({ projectId });
    if (!existingProject) {
      logger.warn(`[${requestId}] Project not found`, { tenantId, projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    if (existingProject.tenantId !== tenantId) {
      logger.warn(`[${requestId}] Access denied`, { tenantId, projectId });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update project
    const updatedProject = await Project.findOneAndUpdate(
      { projectId },
      { $set: projectData },
      { new: true, runValidators: true }
    );

    // Get event delivery statuses
    const scheduledStatus = await EventDeliveryStatus.findOne({
      tenantId: { $in: [tenantId, -1] },
      statusCode: 'SCHEDULED'
    });

    // Update/Create/Delete events intelligently
    if (events) {
      const existingEvents = await ClientEvent.find({ projectId }).lean();
      const processedEventIds = new Set();
      
      for (const eventData of events) {
        if (eventData.clientEventId) {
          // Update existing event (preserve its status)
          processedEventIds.add(eventData.clientEventId);
          
          await ClientEvent.findOneAndUpdate(
            { clientEventId: eventData.clientEventId },
            {
              $set: {
                eventId: eventData.eventId,
                fromDatetime: eventData.fromDatetime,
                toDatetime: eventData.toDatetime,
                duration: eventData.duration,
                venue: eventData.venue,
                venueMapUrl: eventData.venueMapUrl,
                city: eventData.city,
                teamMembersAssigned: eventData.teamMembersAssigned || [],
                updatedBy: userId,
              }
            }
          );
        } else {
          // Create new event with SCHEDULED status
          const clientEventId = `clientevent_${nanoid()}`;
          processedEventIds.add(clientEventId);
          
          // Fetch event master data to get event name
          const eventMaster = await Event.findOne({ 
            eventId: eventData.eventId,
            tenantId: { $in: [tenantId, -1] }
          });
          
          // Generate S3 folder name from event description
          const s3EventFolderName = eventMaster?.eventDesc.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'event';
          
          await ClientEvent.create({
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
            s3EventFolderName,
            createdBy: userId,
          });
        }
      }
      
      // Delete events that are no longer in the list
      const eventIdsToDelete = existingEvents
        .filter(e => !processedEventIds.has(e.clientEventId))
        .map(e => e.clientEventId);
      
      if (eventIdsToDelete.length > 0) {
        await ClientEvent.deleteMany({ 
          clientEventId: { $in: eventIdsToDelete }
        });
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

    logger.info(`[${requestId}] Project with details updated`, { 
      tenantId, 
      projectId,
      financeUpdated: !!projectFinance
    });

    // Audit log
    logAudit({
      action: auditEvents.TENANT_UPDATED,
      entityType: 'Project',
      entityId: projectId,
      tenantId,
      performedBy: userId || 'System',
      changes: {},
      metadata: {
        projectName: existingProject.projectName,
        hasFinance: !!projectFinance
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
      finance: projectFinance,
    });
  } catch (err: any) {
    logger.error(`[${requestId}] Error updating project with details`, { 
      tenantId,
      projectId,
      error: err.message,
      stack: err.stack 
    });
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