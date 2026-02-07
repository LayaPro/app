import cron from 'node-cron';
import { nanoid } from 'nanoid';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Project from '../models/project';
import { NotificationUtils } from '../services/notificationUtils';
import { emitEventStatusUpdate } from '../services/socketService';
import { createModuleLogger } from '../utils/logger';
import { logAudit, auditEvents } from '../utils/auditLogger';

const logger = createModuleLogger('EventStatusUpdaterCron');

/**
 * Cron job to automatically update event statuses based on datetime
 * Runs every minute
 */
export const startEventStatusUpdater = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const jobId = nanoid(8);
    const now = new Date();
    
    logger.info(`[${jobId}] Starting event status check`, { timestamp: now.toISOString() });

    try {
      // Get global statuses (tenantId: -1)
      const scheduledStatus = await EventDeliveryStatus.findOne({ statusCode: 'SCHEDULED', tenantId: -1 }).lean();
      const shootInProgressStatus = await EventDeliveryStatus.findOne({ statusCode: 'SHOOT_IN_PROGRESS', tenantId: -1 }).lean();
      const awaitingEditingStatus = await EventDeliveryStatus.findOne({ statusCode: 'AWAITING_EDITING', tenantId: -1 }).lean();

      if (!scheduledStatus || !shootInProgressStatus || !awaitingEditingStatus) {
        logger.error(`[${jobId}] Required statuses not found. Seed script may not have run.`, {
          found: {
            scheduled: !!scheduledStatus,
            shootInProgress: !!shootInProgressStatus,
            awaitingEditing: !!awaitingEditingStatus
          }
        });
        return;
      }

      let updatedToInProgress = 0;
      let updatedToAwaitingEditing = 0;

      // Check all SCHEDULED events for debugging
      const allScheduledEvents = await ClientEvent.find({
        eventDeliveryStatusId: scheduledStatus.statusId
      }).select('clientEventId tenantId projectId fromDatetime toDatetime eventDeliveryStatusId').lean();
      
      if (allScheduledEvents.length > 0) {
        logger.debug(`[${jobId}] Found ${allScheduledEvents.length} SCHEDULED events to evaluate`);
        allScheduledEvents.forEach(e => {
          const fromDate = e.fromDatetime ? new Date(e.fromDatetime) : null;
          const toDate = e.toDatetime ? new Date(e.toDatetime) : null;
          const shouldStart = fromDate && fromDate <= now;
          const shouldNotEnd = toDate && toDate > now;
          logger.debug(`[${jobId}] Event evaluation`, {
            clientEventId: e.clientEventId,
            tenantId: e.tenantId,
            projectId: e.projectId,
            fromDatetime: fromDate?.toISOString(),
            toDatetime: toDate?.toISOString(),
            shouldStart,
            shouldNotEnd,
            willUpdate: shouldStart && shouldNotEnd
          });
        });
      }

      // 1. Update SCHEDULED → SHOOT_IN_PROGRESS
      // Criteria: status = SCHEDULED AND fromDatetime <= now AND toDatetime > now
      const eventsToStart = await ClientEvent.find({
        eventDeliveryStatusId: scheduledStatus.statusId,
        fromDatetime: { $lte: now },
        toDatetime: { $gt: now }
      });

      if (eventsToStart.length > 0) {
        logger.info(`[${jobId}] Updating ${eventsToStart.length} events to SHOOT_IN_PROGRESS`);
        
        // Update each event individually and trigger notifications
        for (const event of eventsToStart) {
          const tenantId = event.tenantId;
          const eventId = event.clientEventId;
          const projectId = event.projectId;
          
          logger.info(`[${jobId}] Processing event for status change`, {
            tenantId,
            eventId,
            projectId,
            fromStatus: 'SCHEDULED',
            toStatus: 'SHOOT_IN_PROGRESS'
          });
          
          const oldStatusId = event.eventDeliveryStatusId;
          event.eventDeliveryStatusId = shootInProgressStatus.statusId;
          event.updatedBy = 'system-cron';
          await event.save();
          
          // Log audit trail for status change
          logAudit({
            action: auditEvents.TENANT_UPDATED,
            entityType: 'ClientEvent',
            entityId: eventId,
            tenantId,
            performedBy: 'system-cron',
            changes: {
              eventDeliveryStatusId: { from: oldStatusId, to: shootInProgressStatus.statusId }
            },
            metadata: {
              projectId,
              statusCode: 'SHOOT_IN_PROGRESS',
              fromDatetime: event.fromDatetime,
              toDatetime: event.toDatetime,
              triggeredBy: 'cron-job'
            },
            ipAddress: 'system'
          });
          
          logger.info(`[${jobId}] Event status updated`, {
            tenantId,
            eventId,
            projectId,
            newStatus: 'SHOOT_IN_PROGRESS'
          });
          
          // Emit socket event for real-time update
          emitEventStatusUpdate(tenantId, {
            clientEventId: eventId,
            eventDeliveryStatusId: shootInProgressStatus.statusId,
            statusCode: 'SHOOT_IN_PROGRESS',
            updatedAt: new Date()
          });
          
          // Trigger notification for admins
          try {
            const project = await Project.findOne({ projectId });
            if (project) {
              logger.info(`[${jobId}] Sending shoot start notification`, {
                tenantId,
                eventId,
                projectId,
                projectName: project.projectName
              });
              await NotificationUtils.notifyShootInProgress(event, project.projectName);
              logger.info(`[${jobId}] Notification sent successfully`, { tenantId, eventId });
            } else {
              logger.warn(`[${jobId}] Project not found`, { tenantId, eventId, projectId });
            }
          } catch (notifError: any) {
            logger.error(`[${jobId}] Error sending notification`, {
              tenantId,
              eventId,
              error: notifError.message,
              stack: notifError.stack
            });
          }
          
          updatedToInProgress++;
        }
      }

      // 2. Update SHOOT_IN_PROGRESS → AWAITING_EDITING
      // Criteria: status = SHOOT_IN_PROGRESS AND toDatetime <= now
      const eventsToFinish = await ClientEvent.find({
        eventDeliveryStatusId: shootInProgressStatus.statusId,
        toDatetime: { $lte: now }
      });

      if (eventsToFinish.length > 0) {
        logger.info(`[${jobId}] Updating ${eventsToFinish.length} events to AWAITING_EDITING`);
        
        // Update each event individually and trigger notifications if no editor assigned
        for (const event of eventsToFinish) {
          const tenantId = event.tenantId;
          const eventId = event.clientEventId;
          const projectId = event.projectId;
          
          logger.info(`[${jobId}] Processing event for status change`, {
            tenantId,
            eventId,
            projectId,
            fromStatus: 'SHOOT_IN_PROGRESS',
            toStatus: 'AWAITING_EDITING'
          });
          
          const oldStatusId = event.eventDeliveryStatusId;
          event.eventDeliveryStatusId = awaitingEditingStatus.statusId;
          event.updatedBy = 'system-cron';
          await event.save();
          
          // Log audit trail for status change
          logAudit({
            action: auditEvents.TENANT_UPDATED,
            entityType: 'ClientEvent',
            entityId: eventId,
            tenantId,
            performedBy: 'system-cron',
            changes: {
              eventDeliveryStatusId: { from: oldStatusId, to: awaitingEditingStatus.statusId }
            },
            metadata: {
              projectId,
              statusCode: 'AWAITING_EDITING',
              toDatetime: event.toDatetime,
              albumEditor: event.albumEditor || null,
              triggeredBy: 'cron-job'
            },
            ipAddress: 'system'
          });
          
          logger.info(`[${jobId}] Event status updated`, {
            tenantId,
            eventId,
            projectId,
            newStatus: 'AWAITING_EDITING',
            hasEditor: !!event.albumEditor
          });
          
          // Emit socket event for real-time update
          emitEventStatusUpdate(tenantId, {
            clientEventId: eventId,
            eventDeliveryStatusId: awaitingEditingStatus.statusId,
            statusCode: 'AWAITING_EDITING',
            updatedAt: new Date()
          });
          
          // Notify admins if no editor assigned
          if (!event.albumEditor) {
            try {
              const project = await Project.findOne({ projectId });
              if (project) {
                logger.info(`[${jobId}] Sending editor assignment notification`, {
                  tenantId,
                  eventId,
                  projectId,
                  projectName: project.projectName
                });
                await NotificationUtils.notifyAssignEditorNeeded(event, project.projectName);
                logger.info(`[${jobId}] Editor notification sent`, { tenantId, eventId });
              } else {
                logger.warn(`[${jobId}] Project not found`, { tenantId, eventId, projectId });
              }
            } catch (notifError: any) {
              logger.error(`[${jobId}] Error sending editor notification`, {
                tenantId,
                eventId,
                error: notifError.message,
                stack: notifError.stack
              });
            }
          } else {
            logger.info(`[${jobId}] Editor already assigned, skipping notification`, {
              tenantId,
              eventId,
              albumEditor: event.albumEditor
            });
          }
          
          updatedToAwaitingEditing++;
        }
      }

      if (updatedToInProgress > 0) {
        logger.info(`[${jobId}] Completed: Updated ${updatedToInProgress} event(s) to SHOOT_IN_PROGRESS`);
      }
      if (updatedToAwaitingEditing > 0) {
        logger.info(`[${jobId}] Completed: Updated ${updatedToAwaitingEditing} event(s) to AWAITING_EDITING`);
      }
      if (updatedToInProgress === 0 && updatedToAwaitingEditing === 0) {
        logger.debug(`[${jobId}] No events required status updates`);
      }
      
      logger.info(`[${jobId}] Event status check completed`, {
        updatedToInProgress,
        updatedToAwaitingEditing,
        totalUpdated: updatedToInProgress + updatedToAwaitingEditing
      });
    } catch (error: any) {
      logger.error(`[${jobId}] Error updating event statuses`, {
        error: error.message,
        stack: error.stack
      });
    }
  });

  logger.info('Event status updater cron job started (runs every minute)');
};
