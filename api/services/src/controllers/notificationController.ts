import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { NotificationService } from '../services/notificationService';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('NotificationController');

export class NotificationController {
  /**
   * GET /api/notifications - Get user's notifications
   */
  static async getNotifications(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    logger.info(`[${requestId}] Fetching notifications`, { tenantId, userId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
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

      logger.info(`[${requestId}] Notifications retrieved`, { tenantId, userId, count: transformedNotifications.length, unreadOnly });

      res.json({ notifications: transformedNotifications });
    } catch (error: any) {
      logger.error(`[${requestId}] Error fetching notifications`, { 
        tenantId,
        userId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  /**
   * GET /api/notifications/unread-count - Get unread count
   */
  static async getUnreadCount(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    logger.info(`[${requestId}] Fetching unread count`, { tenantId, userId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await NotificationService.getUnreadCount(userId, tenantId);

      logger.info(`[${requestId}] Unread count retrieved`, { tenantId, userId, count });

      res.json({ count });
    } catch (error: any) {
      logger.error(`[${requestId}] Error fetching unread count`, { 
        tenantId,
        userId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }

  /**
   * POST /api/notifications/:id/read - Mark notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;
    const notificationId = req.params.id;

    logger.info(`[${requestId}] Marking notification as read`, { tenantId, userId, notificationId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await NotificationService.markAsRead(notificationId, userId, tenantId);

      if (!notification) {
        logger.warn(`[${requestId}] Notification not found`, { tenantId, userId, notificationId });
        return res.status(404).json({ error: 'Notification not found' });
      }

      logger.info(`[${requestId}] Notification marked as read`, { tenantId, userId, notificationId });

      res.json({ notification });
    } catch (error: any) {
      logger.error(`[${requestId}] Error marking notification as read`, { 
        tenantId,
        userId,
        notificationId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  /**
   * POST /api/notifications/read-all - Mark all as read
   */
  static async markAllAsRead(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    logger.info(`[${requestId}] Marking all notifications as read`, { tenantId, userId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await NotificationService.markAllAsRead(userId, tenantId);

      logger.info(`[${requestId}] All notifications marked as read`, { tenantId, userId, count });

      res.json({ count });
    } catch (error: any) {
      logger.error(`[${requestId}] Error marking all as read`, { 
        tenantId,
        userId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  }

  /**
   * DELETE /api/notifications/:id - Delete notification
   */
  static async deleteNotification(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;
    const notificationId = req.params.id;

    logger.info(`[${requestId}] Deleting notification`, { tenantId, userId, notificationId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const deleted = await NotificationService.delete(notificationId, userId, tenantId);

      if (!deleted) {
        logger.warn(`[${requestId}] Notification not found`, { tenantId, userId, notificationId });
        return res.status(404).json({ error: 'Notification not found' });
      }

      logger.info(`[${requestId}] Notification deleted`, { tenantId, userId, notificationId });

      res.json({ success: true });
    } catch (error: any) {
      logger.error(`[${requestId}] Error deleting notification`, { 
        tenantId,
        userId,
        notificationId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  /**
   * POST /api/notifications/test - Test endpoint to create sample notification
   */
  static async createTestNotification(req: Request, res: Response) {
    const requestId = nanoid(8);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    logger.info(`[${requestId}] Creating test notification`, { tenantId, userId });

    try {
      if (!userId || !tenantId) {
        logger.warn(`[${requestId}] Unauthorized access attempt`, { userId, tenantId });
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

      logger.info(`[${requestId}] Test notification created`, { tenantId, userId });

      res.json({ notification: notifications[0], message: 'Test notification sent!' });
    } catch (error: any) {
      logger.error(`[${requestId}] Error creating test notification`, { 
        tenantId,
        userId,
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  }
}
