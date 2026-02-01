import cron from 'node-cron';
import dueDateNotificationService from '../services/dueDateNotificationService';

/**
 * Cron job to check due dates daily and send notifications
 * Runs every day at 9:00 AM
 */
export const startDueDateChecker = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[DueDateChecker] Running scheduled due date check at', new Date().toISOString());
    try {
      await dueDateNotificationService.checkAllDueDates();
    } catch (error) {
      console.error('[DueDateChecker] Error in scheduled due date check:', error);
    }
  });

  console.log('[DueDateChecker] Due date checker cron job started (runs daily at 9:00 AM)');
};

/**
 * Manually trigger due date check (useful for testing)
 */
export const triggerDueDateCheck = async () => {
  console.log('[DueDateChecker] Manual due date check triggered at', new Date().toISOString());
  try {
    await dueDateNotificationService.checkAllDueDates();
    console.log('[DueDateChecker] Manual due date check completed');
  } catch (error) {
    console.error('[DueDateChecker] Error in manual due date check:', error);
    throw error;
  }
};
