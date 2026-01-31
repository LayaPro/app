import { User, IUser } from '../models/user';
import { Role } from '../models/role';
import { IClientEvent } from '../models/clientEvent';
import { Event } from '../models/event';
import { NotificationService } from './notificationService';
import { sendNotificationToUsers } from './socketService';

export const NOTIFICATION_TYPES = {
  ASSIGN_EDITOR_NEEDED: 'ASSIGN_EDITOR_NEEDED',
  ASSIGN_DESIGNER_NEEDED: 'ASSIGN_DESIGNER_NEEDED',
  DUE_DATE_APPROACHING: 'DUE_DATE_APPROACHING',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED_TO_TASK: 'ASSIGNED_TO_TASK',
  SHOOT_IN_PROGRESS: 'SHOOT_IN_PROGRESS',
} as const;

export class NotificationUtils {
  /**
   * Get all active admin users for a tenant
   */
  static async getAdminUsers(tenantId: string): Promise<IUser[]> {
    try {
      // Find the admin role (global role with tenantId = '-1')
      const adminRole = await Role.findOne({ 
        name: { $regex: /^admin$/i }, 
        tenantId: '-1' 
      });
      
      if (!adminRole) {
        console.error('Admin role not found');
        return [];
      }

      // Find all active users with admin role for this tenant
      const adminUsers = await User.find({
        tenantId,
        roleId: adminRole.roleId,
        isActive: true,
      });

      return adminUsers;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Notify admins that an event needs an editor assigned
   */
  static async notifyAssignEditorNeeded(
    event: IClientEvent,
    projectName: string
  ): Promise<void> {
    try {
      // Check if editor is already assigned
      if (event.albumEditor) {
        console.log('Editor already assigned, skipping notification');
        return;
      }

      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(event.tenantId);

      if (adminUsers.length === 0) {
        console.log('No admin users found for tenant:', event.tenantId);
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);

      // Create notification
      const notification = await NotificationService.create({
        userId: userIds,
        tenantId: event.tenantId,
        type: NOTIFICATION_TYPES.ASSIGN_EDITOR_NEEDED,
        title: 'Editor Assignment Required',
        message: `Please assign an editor to ${eventName} in project ${projectName}`,
        data: {
          eventId: event.clientEventId,
          projectId: event.projectId,
          eventName: eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      // Send real-time notification to all admins
      if (notification.length > 0) {
        sendNotificationToUsers(userIds, notification[0]);
      }

      console.log(
        `Notification sent to ${userIds.length} admins for event ${event.clientEventId}`
      );
    } catch (error) {
      console.error('Error sending assign editor notification:', error);
    }
  }

  /**
   * Notify admins that an event needs a designer assigned
   */
  static async notifyAssignDesignerNeeded(
    event: IClientEvent,
    projectName: string
  ): Promise<void> {
    try {
      // Check if designer is already assigned
      if (event.albumDesigner) {
        console.log('Designer already assigned, skipping notification');
        return;
      }

      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(event.tenantId);

      if (adminUsers.length === 0) {
        console.log('No admin users found for tenant:', event.tenantId);
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);

      // Create notification
      const notification = await NotificationService.create({
        userId: userIds,
        tenantId: event.tenantId,
        type: NOTIFICATION_TYPES.ASSIGN_DESIGNER_NEEDED,
        title: 'Designer Assignment Required',
        message: `Please assign a designer to ${eventName} in project ${projectName}`,
        data: {
          eventId: event.clientEventId,
          projectId: event.projectId,
          eventName: eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      // Send real-time notification to all admins
      if (notification.length > 0) {
        sendNotificationToUsers(userIds, notification[0]);
      }

      console.log(
        `Notification sent to ${userIds.length} admins for event ${event.clientEventId}`
      );
    } catch (error) {
      console.error('Error sending assign designer notification:', error);
    }
  }

  /**
   * Notify user they have been assigned to a task
   */
  static async notifyUserAssignment(
    userId: string,
    tenantId: string,
    eventName: string,
    projectName: string,
    role: 'editor' | 'designer',
    dueDate?: Date
  ): Promise<void> {
    try {
      const dueDateText = dueDate
        ? ` (Due: ${new Date(dueDate).toLocaleDateString()})`
        : '';
      const roleText = role === 'editor' ? 'editor' : 'album designer';

      const notification = await NotificationService.create({
        userId: [userId],
        tenantId,
        type: NOTIFICATION_TYPES.ASSIGNED_TO_TASK,
        title: `You've been assigned as ${roleText}`,
        message: `You've been assigned as ${roleText} for ${eventName} in project ${projectName}${dueDateText}`,
        data: {
          eventName,
          projectName,
          role,
          dueDate,
        },
        actionUrl: `/projects`,
      });

      // Send real-time notification
      if (notification.length > 0) {
        sendNotificationToUsers([userId], notification[0]);
      }
    } catch (error) {
      console.error('Error sending assignment notification:', error);
    }
  }

  /**
   * Notify admins when shoot starts (status changes from SCHEDULED to SHOOT_IN_PROGRESS)
   */
  static async notifyShootInProgress(
    event: IClientEvent,
    projectName: string
  ): Promise<void> {
    try {
      console.log(`[notifyShootInProgress] Called for event ${event.clientEventId}`);
      
      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(event.tenantId);

      if (adminUsers.length === 0) {
        console.log('No admin users found for tenant:', event.tenantId);
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);
      console.log(`[notifyShootInProgress] Creating notification for ${userIds.length} admins:`, userIds);

      // Create notification
      const notification = await NotificationService.create({
        userId: userIds,
        tenantId: event.tenantId,
        type: NOTIFICATION_TYPES.SHOOT_IN_PROGRESS,
        title: 'Shoot Started',
        message: `${eventName} shoot is now in progress for project ${projectName}`,
        data: {
          eventId: event.clientEventId,
          projectId: event.projectId,
          eventName: eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      console.log(`[notifyShootInProgress] Created ${notification.length} notification records`);

      // Send real-time notification to all admins
      if (notification.length > 0) {
        sendNotificationToUsers(userIds, notification[0]);
      }

      console.log(
        `Shoot in progress notification sent to ${userIds.length} admins for event ${event.clientEventId}`
      );
    } catch (error) {
      console.error('Error sending shoot in progress notification:', error);
    }
  }
}
