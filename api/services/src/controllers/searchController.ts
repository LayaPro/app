import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Team from '../models/team';
import Equipment from '../models/equipment';
import Image from '../models/image';
import Event from '../models/event';
import Profile from '../models/profile';

const Proposal = require('../models/proposal').default;

interface SearchResultItem {
  id: string;
  type: 'proposal' | 'project' | 'event' | 'team' | 'equipment' | 'image';
  title: string;
  subtitle?: string;
  metadata?: any;
  url?: string;
}

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit: limitParam, page: pageParam, type: typeFilter } = req.query;
    const tenantId = req.user?.tenantId;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query (q) is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const searchQuery = q.trim();
    
    if (searchQuery.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    // Parse pagination params: limit defaults to 10 for dropdown, page defaults to 1
    const limit = limitParam ? parseInt(limitParam as string, 10) : 10;
    const page = pageParam ? parseInt(pageParam as string, 10) : 1;
    const skip = (page - 1) * limit;
    
    // Type filter: 'all' or specific type like 'proposal', 'project', etc.
    const filter = (typeFilter as string) || 'all';
    
    const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive search

    // First, find matching event types to search clientEvents by event name
    // Search both tenant-specific events and global events (tenantId: -1)
    const matchingEvents = await Event.find({
      tenantId: { $in: [tenantId, '-1'] }, // Include both tenant-specific and global events
      $or: [
        { eventCode: searchRegex },
        { eventDesc: searchRegex },
        { eventAlias: searchRegex }
      ]
    }).select('eventId eventCode eventDesc eventAlias').lean();
    
    console.log('[SEARCH DEBUG] Query:', searchQuery);
    console.log('[SEARCH DEBUG] Found matching events:', matchingEvents);
    
    const matchingEventIds = matchingEvents.map((e: any) => e.eventId);

    // Define search criteria for reuse
    const proposalCriteria = {
      tenantId,
      $or: [
        { projectName: searchRegex },
        { clientName: searchRegex },
        { proposalId: searchRegex }
      ]
    };

    const projectCriteria = {
      tenantId,
      $or: [
        { projectName: searchRegex },
        { brideFirstName: searchRegex },
        { groomFirstName: searchRegex },
        { brideLastName: searchRegex },
        { groomLastName: searchRegex },
        { phoneNumber: searchRegex },
        { projectId: searchRegex },
        { clientName: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex }
      ]
    };

    const clientEventCriteria = {
      tenantId,
      $or: [
        { venue: searchRegex },
        { city: searchRegex },
        { clientEventId: searchRegex },
        { notes: searchRegex },
        ...(matchingEventIds.length > 0 ? [{ eventId: { $in: matchingEventIds } }] : [])
      ]
    };

    const teamCriteria = {
      tenantId,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { memberId: searchRegex }
      ]
    };

    const equipmentCriteria = {
      tenantId,
      $or: [
        { name: searchRegex },
        { serialNumber: searchRegex },
        { brand: searchRegex },
        { equipmentId: searchRegex }
      ]
    };

    const imageCriteria = {
      tenantId,
      $or: [
        { fileName: searchRegex },
        { tags: searchRegex },
        { imageId: searchRegex }
      ]
    };

    const profileCriteria = {
      tenantId,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    };

    // Search across all entities in parallel (both data and counts)
    // Only search entities that match the filter
    const [
      proposals,
      projects,
      clientEvents,
      teamMembers,
      equipment,
      images,
      profiles,
      proposalCount,
      projectCount,
      clientEventCount,
      teamCount,
      equipmentCount,
      imageCount,
      profileCount
    ] = await Promise.all([
      // Search Proposals - get all matches, we'll paginate combined results
      (filter === 'all' || filter === 'proposal') ? Proposal.find(proposalCriteria)
        .select('proposalId projectName clientName status totalAmount createdAt')
        .lean() : Promise.resolve([]),

      // Search Projects (includes customer/client information)
      (filter === 'all' || filter === 'project') ? Project.find(projectCriteria)
        .select('projectId projectName clientName contactPerson email brideFirstName groomFirstName status createdAt')
        .lean() : Promise.resolve([]),

      // Search Client Events
      (filter === 'all' || filter === 'event') ? ClientEvent.find(clientEventCriteria)
        .select('clientEventId projectId venue city eventId notes createdAt')
        .lean() : Promise.resolve([]),

      // Search Team Members
      (filter === 'all' || filter === 'team') ? Team.find(teamCriteria)
        .select('memberId firstName lastName email phoneNumber role createdAt')
        .lean() : Promise.resolve([]),

      // Search Equipment
      (filter === 'all' || filter === 'equipment') ? Equipment.find(equipmentCriteria)
        .select('equipmentId name brand serialNumber status createdAt')
        .lean() : Promise.resolve([]),

      // Search Images
      (filter === 'all' || filter === 'image') ? Image.find(imageCriteria)
        .select('imageId fileName projectId clientEventId tags thumbnailUrl compressedUrl originalUrl createdAt')
        .lean() : Promise.resolve([]),

      // Search Profiles
      (filter === 'all' || filter === 'profile') ? Profile.find(profileCriteria)
        .select('profileId name description createdAt')
        .lean() : Promise.resolve([]),

      // Count queries for total results
      Proposal.countDocuments(proposalCriteria),
      Project.countDocuments(projectCriteria),
      ClientEvent.countDocuments(clientEventCriteria),
      Team.countDocuments(teamCriteria),
      Equipment.countDocuments(equipmentCriteria),
      Image.countDocuments(imageCriteria),
      Profile.countDocuments(profileCriteria)
    ]);

    // Fetch related data for events (projects and event types)
    let eventProjects: any[] = [];
    let eventTypes: any[] = [];
    if (clientEvents.length > 0) {
      const eventProjectIds = [...new Set(clientEvents.map((e: any) => e.projectId).filter(Boolean))];
      const eventEventIds = [...new Set(clientEvents.map((e: any) => e.eventId).filter(Boolean))];
      
      [eventProjects, eventTypes] = await Promise.all([
        eventProjectIds.length > 0 ? Project.find({ projectId: { $in: eventProjectIds } })
          .select('projectId projectName clientName brideFirstName groomFirstName')
          .lean() : Promise.resolve([]),
        eventEventIds.length > 0 ? Event.find({ eventId: { $in: eventEventIds } })
          .select('eventId eventCode eventDesc eventAlias')
          .lean() : Promise.resolve([])
      ]);
    }

    // Transform results into unified format for frontend
    const results: SearchResultItem[] = [];

    // Add proposals
    proposals.forEach((proposal: any) => {
      results.push({
        id: proposal.proposalId,
        type: 'proposal',
        title: proposal.projectName || 'Untitled Proposal',
        subtitle: proposal.clientName,
        metadata: {
          status: proposal.status,
          amount: proposal.totalAmount,
          createdAt: proposal.createdAt
        },
        url: `/proposals?view=${proposal.proposalId}`
      });
    });

    // Add projects
    projects.forEach((project: any) => {
      const coupleName = [project.brideFirstName, project.groomFirstName].filter(Boolean).join(' & ');
      const contactInfo = project.contactPerson || project.email;
      results.push({
        id: project.projectId,
        type: 'project',
        title: project.projectName || coupleName || 'Untitled Project',
        subtitle: contactInfo || coupleName,
        metadata: {
          status: project.status,
          createdAt: project.createdAt
        },
        url: `/projects?view=${project.projectId}`
      });
    });

    // Add events
    clientEvents.forEach((event: any) => {
      // Look up project name and event type name
      const project = eventProjects.find((p: any) => p.projectId === event.projectId);
      const eventType = eventTypes.find((e: any) => e.eventId === event.eventId);
      
      const projectName = project?.projectName || '';
      const eventTypeName = eventType?.eventDesc || eventType?.eventAlias || eventType?.eventCode || '';
      
      results.push({
        id: event.clientEventId,
        type: 'event',
        title: eventTypeName || projectName || 'Untitled Event',
        subtitle: projectName && eventTypeName ? `${projectName}${event.venue ? ` - ${event.venue}` : ''}` : (event.venue || ''),
        metadata: {
          projectId: event.projectId,
          venue: event.venue,
          city: event.city,
          createdAt: event.createdAt
        },
        url: `/calendar?view=list&event=${event.clientEventId}`
      });
    });

    // Add team members
    teamMembers.forEach((member: any) => {
      results.push({
        id: member.memberId,
        type: 'team',
        title: `${member.firstName} ${member.lastName}`,
        subtitle: member.email || member.role,
        metadata: {
          email: member.email,
          phone: member.phoneNumber,
          role: member.role,
          createdAt: member.createdAt
        },
        url: `/team?view=${member.memberId}`
      });
    });

    // Add equipment
    equipment.forEach((item: any) => {
      results.push({
        id: item.equipmentId,
        type: 'equipment',
        title: item.name,
        subtitle: `${item.brand || ''}${item.serialNumber ? ` - ${item.serialNumber}` : ''}`,
        metadata: {
          brand: item.brand,
          serialNumber: item.serialNumber,
          status: item.status,
          createdAt: item.createdAt
        },
        url: `/equipment?view=${item.equipmentId}`
      });
    });

    // Add images - lookup project/event names for context
    // If we have images, fetch their related projects/events by ID (not by search query)
    let imageProjects: any[] = [];
    let imageClientEvents: any[] = [];
    
    if (images.length > 0) {
      const imageProjectIds = [...new Set(images.map((img: any) => img.projectId).filter(Boolean))];
      const imageClientEventIds = [...new Set(images.map((img: any) => img.clientEventId).filter(Boolean))];
      
      [imageProjects, imageClientEvents] = await Promise.all([
        imageProjectIds.length > 0 ? Project.find({ projectId: { $in: imageProjectIds }, tenantId })
          .select('projectId projectName')
          .lean() : Promise.resolve([]),
        imageClientEventIds.length > 0 ? ClientEvent.find({ clientEventId: { $in: imageClientEventIds }, tenantId })
          .select('clientEventId venue eventId')
          .lean() : Promise.resolve([])
      ]);
    }
    
    for (const image of images) {
      let subtitle = '';
      
      // Try to get project name from imageProjects (fetched by ID)
      if (image.projectId) {
        const project = imageProjects.find((p: any) => p.projectId === image.projectId);
        if (project) {
          subtitle = project.projectName || '';
        }
      }
      
      // Try to get event venue if no project name
      if (!subtitle && image.clientEventId) {
        const event = imageClientEvents.find((e: any) => e.clientEventId === image.clientEventId);
        if (event) {
          subtitle = event.venue || '';
        }
      }
      
      // Fallback to tags
      if (!subtitle) {
        subtitle = image.tags?.length ? image.tags.join(', ') : 'No project/event';
      }
      
      results.push({
        id: image.imageId,
        type: 'image',
        title: image.fileName,
        subtitle: subtitle,
        metadata: {
          projectId: image.projectId,
          clientEventId: image.clientEventId,
          tags: image.tags,
          imageUrl: image.thumbnailUrl || image.compressedUrl || image.originalUrl,
          createdAt: image.createdAt
        },
        url: image.projectId ? `/gallery?project=${image.projectId}${image.clientEventId ? `&event=${image.clientEventId}` : ''}` : '/gallery'
      });
    }

    // Calculate total results from counts
    const totalCount = proposalCount + projectCount + clientEventCount + teamCount + equipmentCount + imageCount + profileCount;
    
    // Sort results by creation date (newest first)
    results.sort((a, b) => {
      const dateA = a.metadata?.createdAt ? new Date(a.metadata.createdAt).getTime() : 0;
      const dateB = b.metadata?.createdAt ? new Date(b.metadata.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply pagination to combined results
    const startIndex = skip;
    const endIndex = skip + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    const hasMore = totalCount > (skip + paginatedResults.length);

    return res.status(200).json({
      message: 'Search completed successfully',
      query: searchQuery,
      results: paginatedResults,
      totalResults: totalCount,
      displayedResults: paginatedResults.length,
      hasMore,
      breakdown: {
        proposals: proposalCount,
        projects: projectCount,
        events: clientEventCount,
        team: teamCount,
        equipment: equipmentCount,
        images: imageCount,
        profiles: profileCount
      }
    });
  } catch (err: any) {
    console.error('Global search error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export default {
  globalSearch
};
