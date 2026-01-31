import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  /**
   * GET /api/notifications - Get user's notifications
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await NotificationService.getForUser(userId, tenantId, limit, unreadOnly);

      // Transform _id to id for frontend compatibility
      const transformedNotifications = notifications.map((n: any) => ({
        ...n,
        id: n._id.toString(),
      }));

      res.json({ notifications: transformedNotifications });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  /**
   * GET /api/notifications/unread-count - Get unread count
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await NotificationService.getUnreadCount(userId, tenantId);

      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }

  /**
   * POST /api/notifications/:id/read - Mark notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notificationId = req.params.id;
      const notification = await NotificationService.markAsRead(notificationId, userId, tenantId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ notification });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  /**
   * POST /api/notifications/read-all - Mark all as read
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await NotificationService.markAllAsRead(userId, tenantId);

      res.json({ count });
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  }

  /**
   * DELETE /api/notifications/:id - Delete notification
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notificationId = req.params.id;
      const deleted = await NotificationService.delete(notificationId, userId, tenantId);

      if (!deleted) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  /**
   * POST /api/notifications/test - Test endpoint to create sample notification
   */
  static async createTestNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Create a test notification
      const notifications = await NotificationService.create({
        userId,
        tenantId,
        type: 'TEST',
        title: 'Test Notification',
        message: 'This is a test notification to verify the notification system is working correctly.',
        data: { timestamp: new Date() },
        actionUrl: '/dashboard'
      });

      res.json({ notification: notifications[0], message: 'Test notification sent!' });
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  }
}
