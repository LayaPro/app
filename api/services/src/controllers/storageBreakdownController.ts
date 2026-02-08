import { Request, Response } from 'express';
import { Image } from '../models/image';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';
import Event from '../models/event';
import { nanoid } from 'nanoid';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('StorageBreakdownController');

/**
 * Get storage breakdown by project and events
 * GET /api/storage/breakdown/:tenantId
 */
export const getStorageBreakdown = async (req: Request, res: Response) => {
  const requestId = nanoid(8);
  const { tenantId } = req.params;

  logger.info(`[${requestId}] Fetching storage breakdown`, { tenantId });

  try {
    if (!tenantId) {
      logger.warn(`[${requestId}] Tenant ID missing in request`);
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Get all projects for this tenant
    const projects = await Project.find({ tenantId }).lean();
    logger.debug(`[${requestId}] Found ${projects.length} projects`);

    // Build breakdown data
    const breakdown = await Promise.all(
      projects.map(async (project) => {
        // Get all images for this project
        const projectImages = await Image.find({ 
          tenantId, 
          projectId: project.projectId 
        }).lean();

        // Calculate total project storage
        const totalProjectStorage = projectImages.reduce(
          (sum, img) => sum + (img.fileSize || 0), 
          0
        );

        // Get all events for this project
        const projectEvents = await ClientEvent.find({ 
          tenantId, 
          projectId: project.projectId 
        }).lean();

        // Calculate storage per event
        const events = await Promise.all(
          projectEvents.map(async (clientEvent) => {
            const eventImages = projectImages.filter(
              img => img.clientEventId === clientEvent.clientEventId
            );
            
            const eventStorage = eventImages.reduce(
              (sum, img) => sum + (img.fileSize || 0), 
              0
            );

            // Get event name from Event master data
            const event = await Event.findOne({ eventId: clientEvent.eventId }).lean();
            const eventName = event ? (event.eventDesc || event.eventCode) : 'Unknown Event';

            return {
              clientEventId: clientEvent.clientEventId,
              eventName,
              eventDate: clientEvent.fromDatetime,
              imageCount: eventImages.length,
              storageBytes: eventStorage,
              storageGB: Number((eventStorage / (1024 * 1024 * 1024)).toFixed(4)),
            };
          })
        );

        return {
          projectId: project.projectId,
          projectName: project.projectName,
          clientName: project.contactPerson || 'Unknown Client',
          imageCount: projectImages.length,
          storageBytes: totalProjectStorage,
          storageGB: Number((totalProjectStorage / (1024 * 1024 * 1024)).toFixed(4)),
          events: events.sort((a, b) => b.storageBytes - a.storageBytes), // Sort events by storage (largest first)
        };
      })
    );

    // Sort projects by storage (largest first)
    const sortedBreakdown = breakdown.sort((a, b) => b.storageBytes - a.storageBytes);

    // Calculate totals
    const totalImages = sortedBreakdown.reduce((sum, p) => sum + p.imageCount, 0);
    const totalStorageBytes = sortedBreakdown.reduce((sum, p) => sum + p.storageBytes, 0);
    const totalStorageGB = Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(4));

    logger.info(`[${requestId}] Storage breakdown retrieved successfully`, {
      tenantId,
      projectCount: sortedBreakdown.length,
      totalImages,
      totalStorageGB
    });

    res.json({
      tenantId,
      totalImages,
      totalStorageBytes,
      totalStorageGB,
      projectCount: sortedBreakdown.length,
      projects: sortedBreakdown,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching storage breakdown`, {
      tenantId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch storage breakdown' });
  }
};
