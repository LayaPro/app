import cron from 'node-cron';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';
import Project from '../models/project';
import { NotificationUtils } from '../services/notificationUtils';

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

      // Get all tenants' statuses
      const scheduledStatuses = await EventDeliveryStatus.find({ statusCode: 'SCHEDULED' }).lean();
      const shootInProgressStatuses = await EventDeliveryStatus.find({ statusCode: 'SHOOT_IN_PROGRESS' }).lean();
      const awaitingEditingStatuses = await EventDeliveryStatus.find({ statusCode: 'AWAITING_EDITING' }).lean();

      // Create maps for quick lookup by tenantId
      const scheduledStatusMap = new Map(scheduledStatuses.map(s => [s.tenantId, s.statusId]));
      const shootInProgressMap = new Map(shootInProgressStatuses.map(s => [s.tenantId, s.statusId]));
      const awaitingEditingMap = new Map(awaitingEditingStatuses.map(s => [s.tenantId, s.statusId]));

      let updatedToInProgress = 0;
      let updatedToAwaitingEditing = 0;

      // Debug: Check all SCHEDULED events
      for (const [tenantId, scheduledStatusId] of scheduledStatusMap.entries()) {
        const allScheduledEvents = await ClientEvent.find({
          tenantId,
          eventDeliveryStatusId: scheduledStatusId
        }).select('clientEventId fromDatetime toDatetime eventDeliveryStatusId').lean();
        
        if (allScheduledEvents.length > 0) {
          console.log(`[EventStatusUpdater] Found ${allScheduledEvents.length} SCHEDULED events for tenant ${tenantId}:`);
          allScheduledEvents.forEach(e => {
            const fromDate = e.fromDatetime ? new Date(e.fromDatetime) : null;
            const toDate = e.toDatetime ? new Date(e.toDatetime) : null;
            const shouldStart = fromDate && fromDate <= now;
            const shouldNotEnd = toDate && toDate > now;
            console.log(`  - Event ${e.clientEventId}:`);
            console.log(`    From: ${fromDate?.toISOString()} (should start: ${shouldStart})`);
            console.log(`    To: ${toDate?.toISOString()} (should not end: ${shouldNotEnd})`);
            console.log(`    Should update: ${shouldStart && shouldNotEnd}`);
          });
        }
      }

      // 1. Update SCHEDULED → SHOOT_IN_PROGRESS
      // Criteria: status = SCHEDULED AND fromDatetime <= now AND toDatetime > now
      for (const [tenantId, scheduledStatusId] of scheduledStatusMap.entries()) {
        const shootInProgressStatusId = shootInProgressMap.get(tenantId);
        if (!shootInProgressStatusId) continue;

        // Find events that should be updated
        const eventsToUpdate = await ClientEvent.find({
          tenantId,
          eventDeliveryStatusId: scheduledStatusId,
          fromDatetime: { $lte: now },
          toDatetime: { $gt: now }
        });

        if (eventsToUpdate.length > 0) {
          console.log(`[EventStatusUpdater] Updating ${eventsToUpdate.length} events to SHOOT_IN_PROGRESS for tenant ${tenantId}`);
          
          // Update each event individually and trigger notifications
          for (const event of eventsToUpdate) {
            console.log(`[EventStatusUpdater] Processing event ${event.clientEventId}`);
            event.eventDeliveryStatusId = shootInProgressStatusId;
            event.updatedBy = 'system-cron';
            await event.save();
            console.log(`[EventStatusUpdater] Event ${event.clientEventId} status updated`);
            
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
      }

      // 2. Update SHOOT_IN_PROGRESS → AWAITING_EDITING
      // Criteria: status = SHOOT_IN_PROGRESS AND toDatetime <= now
      for (const [tenantId, shootInProgressStatusId] of shootInProgressMap.entries()) {
        const awaitingEditingStatusId = awaitingEditingMap.get(tenantId);
        if (!awaitingEditingStatusId) continue;

        // Find events that should be updated
        const eventsToUpdate = await ClientEvent.find({
          tenantId,
          eventDeliveryStatusId: shootInProgressStatusId,
          toDatetime: { $lte: now }
        });

        if (eventsToUpdate.length > 0) {
          console.log(`[EventStatusUpdater] Updating ${eventsToUpdate.length} events to AWAITING_EDITING`);
          
          // Update each event individually and trigger notifications if no editor assigned
          for (const event of eventsToUpdate) {
            console.log(`[EventStatusUpdater] Processing event ${event.clientEventId} for AWAITING_EDITING`);
            event.eventDeliveryStatusId = awaitingEditingStatusId;
            event.updatedBy = 'system-cron';
            await event.save();
            console.log(`[EventStatusUpdater] Event ${event.clientEventId} status updated to AWAITING_EDITING`);
            
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
