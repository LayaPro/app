import cron from 'node-cron';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Project from '../models/project';
import { NotificationUtils } from '../services/notificationUtils';
import { emitEventStatusUpdate } from '../services/socketService';

/**
 * Cron job to automatically update event statuses based on datetime
 * Runs every minute
 */
export const startEventStatusUpdater = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('[EventStatusUpdater] Running status check...');
      const now = new Date();
      console.log('[EventStatusUpdater] Current time:', now.toISOString());

      // Get global statuses (tenantId: -1)
      const scheduledStatus = await EventDeliveryStatus.findOne({ statusCode: 'SCHEDULED', tenantId: -1 }).lean();
      const shootInProgressStatus = await EventDeliveryStatus.findOne({ statusCode: 'SHOOT_IN_PROGRESS', tenantId: -1 }).lean();
      const awaitingEditingStatus = await EventDeliveryStatus.findOne({ statusCode: 'AWAITING_EDITING', tenantId: -1 }).lean();

      if (!scheduledStatus || !shootInProgressStatus || !awaitingEditingStatus) {
        console.error('[EventStatusUpdater] Required statuses not found. Make sure seed script has run.');
        return;
      }

      let updatedToInProgress = 0;
      let updatedToAwaitingEditing = 0;

      // Debug: Check all SCHEDULED events
      const allScheduledEvents = await ClientEvent.find({
        eventDeliveryStatusId: scheduledStatus.statusId
      }).select('clientEventId tenantId fromDatetime toDatetime eventDeliveryStatusId').lean();
      
      if (allScheduledEvents.length > 0) {
        console.log(`[EventStatusUpdater] Found ${allScheduledEvents.length} SCHEDULED events:`);
        allScheduledEvents.forEach(e => {
          const fromDate = e.fromDatetime ? new Date(e.fromDatetime) : null;
          const toDate = e.toDatetime ? new Date(e.toDatetime) : null;
          const shouldStart = fromDate && fromDate <= now;
          const shouldNotEnd = toDate && toDate > now;
          console.log(`  - Event ${e.clientEventId} (tenant: ${e.tenantId}):`);
          console.log(`    From: ${fromDate?.toISOString()} (should start: ${shouldStart})`);
          console.log(`    To: ${toDate?.toISOString()} (should not end: ${shouldNotEnd})`);
          console.log(`    Should update: ${shouldStart && shouldNotEnd}`);
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
        console.log(`[EventStatusUpdater] Updating ${eventsToStart.length} events to SHOOT_IN_PROGRESS`);
        
        // Update each event individually and trigger notifications
        for (const event of eventsToStart) {
          console.log(`[EventStatusUpdater] Processing event ${event.clientEventId}`);
          event.eventDeliveryStatusId = shootInProgressStatus.statusId;
          event.updatedBy = 'system-cron';
          await event.save();
          console.log(`[EventStatusUpdater] Event ${event.clientEventId} status updated`);
          
          // Emit socket event for real-time update
          emitEventStatusUpdate(event.tenantId, {
            clientEventId: event.clientEventId,
            eventDeliveryStatusId: shootInProgressStatus.statusId,
            statusCode: 'SHOOT_IN_PROGRESS',
            updatedAt: new Date()
          });
          
          // Trigger notification for admins
          try {
            const project = await Project.findOne({ projectId: event.projectId });
            if (project) {
              console.log(`[EventStatusUpdater] Notifying admins about shoot start for event ${event.clientEventId}`);
              await NotificationUtils.notifyShootInProgress(event, project.projectName);
              console.log(`[EventStatusUpdater] Notification sent successfully`);
            } else {
              console.log(`[EventStatusUpdater] Project not found for event ${event.clientEventId}`);
            }
          } catch (notifError) {
            console.error(`[EventStatusUpdater] Error sending notification for event ${event.clientEventId}:`, notifError);
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
        console.log(`[EventStatusUpdater] Updating ${eventsToFinish.length} events to AWAITING_EDITING`);
        
        // Update each event individually and trigger notifications if no editor assigned
        for (const event of eventsToFinish) {
          console.log(`[EventStatusUpdater] Processing event ${event.clientEventId} for AWAITING_EDITING`);
          event.eventDeliveryStatusId = awaitingEditingStatus.statusId;
          event.updatedBy = 'system-cron';
          await event.save();
          console.log(`[EventStatusUpdater] Event ${event.clientEventId} status updated to AWAITING_EDITING`);
          
          // Emit socket event for real-time update
          emitEventStatusUpdate(event.tenantId, {
            clientEventId: event.clientEventId,
            eventDeliveryStatusId: awaitingEditingStatus.statusId,
            statusCode: 'AWAITING_EDITING',
            updatedAt: new Date()
          });
          
          // Notify admins if no editor assigned
          if (!event.albumEditor) {
            try {
              const project = await Project.findOne({ projectId: event.projectId });
              if (project) {
                console.log(`[EventStatusUpdater] Notifying admins about editor needed for event ${event.clientEventId}`);
                await NotificationUtils.notifyAssignEditorNeeded(event, project.projectName);
                console.log(`[EventStatusUpdater] Editor notification sent successfully`);
              } else {
                console.log(`[EventStatusUpdater] Project not found for event ${event.clientEventId}`);
              }
            } catch (notifError) {
              console.error(`[EventStatusUpdater] Error sending editor notification for event ${event.clientEventId}:`, notifError);
            }
          } else {
            console.log(`[EventStatusUpdater] Editor already assigned to event ${event.clientEventId}, skipping notification`);
          }
          
          updatedToAwaitingEditing++;
        }
      }

      if (updatedToInProgress > 0) {
        console.log(`[EventStatusUpdater] ✓ Updated ${updatedToInProgress} event(s) to SHOOT_IN_PROGRESS`);
      }
      if (updatedToAwaitingEditing > 0) {
        console.log(`[EventStatusUpdater] ✓ Updated ${updatedToAwaitingEditing} event(s) to AWAITING_EDITING`);
      }
      if (updatedToInProgress === 0 && updatedToAwaitingEditing === 0) {
        console.log('[EventStatusUpdater] No events to update');
      }
    } catch (error) {
      console.error('[EventStatusUpdater] Error updating event statuses:', error);
    }
  });

  console.log('✓ Event status updater cron job started (runs every minute)');
};
