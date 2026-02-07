import cron from 'node-cron';
import { nanoid } from 'nanoid';
import dueDateNotificationService from '../services/dueDateNotificationService';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('DueDateCheckerCron');

/**
 * Cron job to check due dates daily and send notifications
 * Runs every day at 9:00 AM
 */
export const startDueDateChecker = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    const jobId = nanoid(8);
    const timestamp = new Date().toISOString();
    
    logger.info(`[${jobId}] Starting scheduled due date check`, { timestamp });
    
    try {
      await dueDateNotificationService.checkAllDueDates();
      logger.info(`[${jobId}] Scheduled due date check completed successfully`, { timestamp });
    } catch (error: any) {
      logger.error(`[${jobId}] Error in scheduled due date check`, {
        timestamp,
        error: error.message,
        stack: error.stack
      });
    }
  });

  logger.info('Due date checker cron job started (runs daily at 9:00 AM)');
};

/**
 * Manually trigger due date check (useful for testing)
 */
export const triggerDueDateCheck = async () => {
  const jobId = nanoid(8);
  const timestamp = new Date().toISOString();
  
  logger.info(`[${jobId}] Manual due date check triggered`, { timestamp });
  
  try {
    await dueDateNotificationService.checkAllDueDates();
    logger.info(`[${jobId}] Manual due date check completed successfully`, { timestamp });
  } catch (error: any) {
    logger.error(`[${jobId}] Error in manual due date check`, {
      timestamp,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};
