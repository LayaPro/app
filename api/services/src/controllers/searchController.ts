import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Team from '../models/team';
import Equipment from '../models/equipment';
import Image from '../models/image';
import Event from '../models/event';
import Profile from '../models/profile';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const tenantId = req.user?.tenantId;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query (q) is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive search

    // Search across all entities in parallel
    const [
      projects,
      clientEvents,
      teamMembers,
      equipment,
      images,
      events,
      profiles
    ] = await Promise.all([
      // Search Projects
      Project.find({
        tenantId,
        $or: [
          { projectName: searchRegex },
          { brideFirstName: searchRegex },
          { groomFirstName: searchRegex },
          { brideLastName: searchRegex },
          { groomLastName: searchRegex },
          { phoneNumber: searchRegex },
          { projectId: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Client Events
      ClientEvent.find({
        tenantId,
        $or: [
          { venue: searchRegex },
          { city: searchRegex },
          { clientEventId: searchRegex },
          { notes: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Team Members
      Team.find({
        tenantId,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
          { memberId: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Equipment
      Equipment.find({
        tenantId,
        $or: [
          { name: searchRegex },
          { serialNumber: searchRegex },
          { brand: searchRegex },
          { equipmentId: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Images
      Image.find({
        tenantId,
        $or: [
          { fileName: searchRegex },
          { tags: searchRegex },
          { imageId: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Events
      Event.find({
        tenantId,
        $or: [
          { eventCode: searchRegex },
          { eventDesc: searchRegex },
          { eventAlias: searchRegex }
        ]
      }).limit(10).lean(),

      // Search Profiles
      Profile.find({
        tenantId,
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      }).limit(10).lean()
    ]);

    // Format results with entity type
    const results = [
      ...projects.map(item => ({ ...item, entityType: 'project' })),
      ...clientEvents.map(item => ({ ...item, entityType: 'clientEvent' })),
      ...teamMembers.map(item => ({ ...item, entityType: 'teamMember' })),
      ...equipment.map(item => ({ ...item, entityType: 'equipment' })),
      ...images.map(item => ({ ...item, entityType: 'image' })),
      ...events.map(item => ({ ...item, entityType: 'event' })),
      ...profiles.map(item => ({ ...item, entityType: 'profile' }))
    ];

    return res.status(200).json({
      message: 'Search completed successfully',
      query: searchQuery,
      totalResults: results.length,
      results: {
        projects,
        clientEvents,
        teamMembers,
        equipment,
        images,
        events,
        profiles
      },
      counts: {
        projects: projects.length,
        clientEvents: clientEvents.length,
        teamMembers: teamMembers.length,
        equipment: equipment.length,
        images: images.length,
        events: events.length,
        profiles: profiles.length,
        total: results.length
      }
    });
  } catch (err: any) {
    console.error('Global search error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  globalSearch
};
