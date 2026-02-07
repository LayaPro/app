import { Notification, INotification } from '../models/notification';
import { sendNotificationToUser, sendNotificationToUsers } from './socketService';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('NotificationService');

export interface CreateNotificationInput {
  userId: string | string[];
  tenantId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Create and send notification to one or more users
   */
  static async create(input: CreateNotificationInput): Promise<INotification[]> {
    const userIds = Array.isArray(input.userId) ? input.userId : [input.userId];
    const notifications: INotification[] = [];

    logger.info('Creating notifications', { 
      tenantId: input.tenantId,
      type: input.type,
      userCount: userIds.length,
      title: input.title 
    });

    for (const userId of userIds) {
      // Check for duplicate notification in the last 10 seconds (prevents accidental double-sends)
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const existingNotification = await Notification.findOne({
        userId,
        tenantId: input.tenantId,
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: { $gte: tenSecondsAgo }
      });

      if (existingNotification) {
        logger.debug('Duplicate notification prevented', { tenantId: input.tenantId, userId, type: input.type });
        continue;
      }

      const notification = await Notification.create({
        userId,
        tenantId: input.tenantId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
        actionUrl: input.actionUrl,
        read: false
      });

      notifications.push(notification);

      // Send real-time notification via Socket.io
      logger.debug('Sending notification via Socket.io', { tenantId: input.tenantId, userId, type: input.type });
      sendNotificationToUser(userId, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
        read: false
      });
    }

    logger.info('Notifications created successfully', { 
      tenantId: input.tenantId,
      type: input.type,
      count: notifications.length 
    });

    return notifications;
  }

  /**
   * Get notifications for a user
   */
  static async getForUser(userId: string, tenantId: string, limit: number = 20, unreadOnly: boolean = false) {
    const query: any = { userId, tenantId };
    if (unreadOnly) {
      query.read = false;
    }

    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return await Notification.countDocuments({ userId, tenantId, read: false });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string, tenantId: string): Promise<INotification | null> {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId, tenantId },
      { read: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, tenantId, read: false },
      { read: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await Notification.deleteOne({ _id: notificationId, userId, tenantId });
    return result.deletedCount > 0;
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAll(userId: string, tenantId: string): Promise<number> {
    const result = await Notification.deleteMany({ userId, tenantId });
    return result.deletedCount;
  }
}
