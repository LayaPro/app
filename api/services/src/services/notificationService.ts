import { Notification, INotification } from '../models/notification';
import { sendNotificationToUser, sendNotificationToUsers } from './socketService';

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

    for (const userId of userIds) {
      // Check for duplicate notification in the last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const existingNotification = await Notification.findOne({
        userId,
        tenantId: input.tenantId,
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: { $gte: twoMinutesAgo }
      });

      if (existingNotification) {
        console.log(`[NotificationService] Duplicate notification prevented for user ${userId}`);
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
