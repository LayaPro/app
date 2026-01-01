import cron from 'node-cron';
import ClientEvent from '../models/clientEvent';
import EventDeliveryStatus from '../models/eventDeliveryStatus';

/**
 * Cron job to automatically update event statuses based on datetime
 * Runs every 15 minutes
 */
export const startEventStatusUpdater = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[EventStatusUpdater] Running status check...');
      const now = new Date();

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

      // 1. Update SCHEDULED → SHOOT_IN_PROGRESS
      // Criteria: status = SCHEDULED AND fromDatetime <= now AND toDatetime > now
      for (const [tenantId, scheduledStatusId] of scheduledStatusMap.entries()) {
        const shootInProgressStatusId = shootInProgressMap.get(tenantId);
        if (!shootInProgressStatusId) continue;

        const result = await ClientEvent.updateMany(
          {
            tenantId,
            eventDeliveryStatusId: scheduledStatusId,
            fromDatetime: { $lte: now },
            toDatetime: { $gt: now }
          },
          {
            $set: {
              eventDeliveryStatusId: shootInProgressStatusId,
              updatedBy: 'system-cron'
            }
          }
        );

        updatedToInProgress += result.modifiedCount || 0;
      }

      // 2. Update SHOOT_IN_PROGRESS → AWAITING_EDITING
      // Criteria: status = SHOOT_IN_PROGRESS AND toDatetime <= now
      for (const [tenantId, shootInProgressStatusId] of shootInProgressMap.entries()) {
        const awaitingEditingStatusId = awaitingEditingMap.get(tenantId);
        if (!awaitingEditingStatusId) continue;

        const result = await ClientEvent.updateMany(
          {
            tenantId,
            eventDeliveryStatusId: shootInProgressStatusId,
            toDatetime: { $lte: now }
          },
          {
            $set: {
              eventDeliveryStatusId: awaitingEditingStatusId,
              updatedBy: 'system-cron'
            }
          }
        );

        updatedToAwaitingEditing += result.modifiedCount || 0;
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

  console.log('✓ Event status updater cron job started (runs every 15 minutes)');
};
