import { User, IUser } from '../models/user';
import { Role } from '../models/role';
import { IClientEvent } from '../models/clientEvent';
import { Event } from '../models/event';
import Team from '../models/team';
import { NotificationService } from './notificationService';
import { sendNotificationToUsers } from './socketService';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('NotificationUtils');

export const NOTIFICATION_TYPES = {
  ASSIGN_EDITOR_NEEDED: 'ASSIGN_EDITOR_NEEDED',
  ASSIGN_DESIGNER_NEEDED: 'ASSIGN_DESIGNER_NEEDED',
  DUE_DATE_APPROACHING: 'DUE_DATE_APPROACHING',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED_TO_TASK: 'ASSIGNED_TO_TASK',
  SHOOT_IN_PROGRESS: 'SHOOT_IN_PROGRESS',
  IMAGES_UPLOADED: 'IMAGES_UPLOADED',
  RE_EDIT_REQUESTED: 'RE_EDIT_REQUESTED',
  IMAGES_APPROVED: 'IMAGES_APPROVED',
  RE_EDIT_COMPLETED: 'RE_EDIT_COMPLETED',
  CLIENT_SELECTION_STARTED: 'CLIENT_SELECTION_STARTED',
  CLIENT_SELECTION_50_PERCENT: 'CLIENT_SELECTION_50_PERCENT',
  CLIENT_SELECTION_100_PERCENT: 'CLIENT_SELECTION_100_PERCENT',
  CLIENT_SELECTION_FINALIZED: 'CLIENT_SELECTION_FINALIZED',
  ASSIGN_DESIGNER_AFTER_SELECTION: 'ASSIGN_DESIGNER_AFTER_SELECTION',
  ALBUM_PDF_UPLOADED: 'ALBUM_PDF_UPLOADED',
  CUSTOMER_ALBUM_REVIEW_STARTED: 'CUSTOMER_ALBUM_REVIEW_STARTED',
  ALBUM_APPROVED_BY_CUSTOMER: 'ALBUM_APPROVED_BY_CUSTOMER',
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
        logger.warn('Admin role not found', { tenantId });
        return [];
      }

      // Find all active users with admin role for this tenant
      const adminUsers = await User.find({
        tenantId,
        roleId: adminRole.roleId,
        isActive: true,
      });

      logger.debug('Retrieved admin users', { tenantId, count: adminUsers.length });
      return adminUsers;
    } catch (error: any) {
      logger.error('Error fetching admin users', { tenantId, error: error.message });
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
      const tenantId = event.tenantId;
      const eventId = event.clientEventId;
      
      // Check if editor is already assigned
      if (event.albumEditor) {
        logger.debug('Editor already assigned, skipping notification', { tenantId, eventId });
        return;
      }

      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(tenantId);

      if (adminUsers.length === 0) {
        logger.warn('No admin users found for tenant', { tenantId, eventId });
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);

      // Create notification (already sends via Socket.io)
      await NotificationService.create({
        userId: userIds,
        tenantId,
        type: NOTIFICATION_TYPES.ASSIGN_EDITOR_NEEDED,
        title: 'Editor Assignment Required',
        message: `Please assign an editor to ${eventName} in project ${projectName}`,
        data: {
          eventId,
          projectId: event.projectId,
          eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      logger.info('Sent editor assignment notification', {
        tenantId,
        eventId,
        projectName,
        recipientCount: userIds.length
      });
    } catch (error: any) {
      logger.error('Error sending assign editor notification', {
        tenantId: event.tenantId,
        eventId: event.clientEventId,
        error: error.message
      });
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
      const tenantId = event.tenantId;
      const eventId = event.clientEventId;
      
      // Check if designer is already assigned
      if (event.albumDesigner) {
        logger.debug('Designer already assigned, skipping notification', { tenantId, eventId });
        return;
      }

      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(tenantId);

      if (adminUsers.length === 0) {
        logger.warn('No admin users found for tenant', { tenantId, eventId });
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);

      // Create notification (already sends via Socket.io)
      await NotificationService.create({
        userId: userIds,
        tenantId,
        type: NOTIFICATION_TYPES.ASSIGN_DESIGNER_NEEDED,
        title: 'Designer Assignment Required',
        message: `Please assign a designer to ${eventName} in project ${projectName}`,
        data: {
          eventId,
          projectId: event.projectId,
          eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      logger.info('Sent designer assignment notification', {
        tenantId,
        eventId,
        projectName,
        recipientCount: userIds.length
      });
    } catch (error: any) {
      logger.error('Error sending assign designer notification', {
        tenantId: event.tenantId,
        eventId: event.clientEventId,
        error: error.message
      });
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

      // Create notification (already sends via Socket.io)
      await NotificationService.create({
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
        actionUrl: `/events`,
      });

      logger.info('Sent user assignment notification', {
        tenantId,
        userId,
        role,
        eventName,
        projectName
      });
    } catch (error: any) {
      logger.error('Error sending assignment notification', {
        tenantId,
        userId,
        error: error.message
      });
    }
  }

  /**
   * Notify editor when admin approves images
   */
  static async notifyImagesApproved(
    tenantId: string,
    editorUserId: string,
    projectName: string,
    eventName: string,
    imageCount: number,
    adminName: string
  ): Promise<void> {
    try {
      logger.info('Sending images approved notification', {
        tenantId,
        editorUserId,
        projectName,
        eventName,
        imageCount,
        adminName
      });
      
      // Create notification for the specific editor
      await NotificationService.create({
        userId: [editorUserId],
        tenantId,
        type: NOTIFICATION_TYPES.IMAGES_APPROVED,
        title: `${imageCount} image${imageCount !== 1 ? 's' : ''} approved`,
        message: `${adminName} approved ${imageCount} image${imageCount !== 1 ? 's' : ''} in ${eventName} (${projectName})`,
        data: {
          adminName,
          projectName,
          eventName,
          imageCount,
        },
        actionUrl: `/albums`,
      });
    } catch (error: any) {
      logger.error('Error sending images approved notification', {
        tenantId,
        editorUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify editor when admin requests re-edit
   */
  static async notifyReEditRequested(
    tenantId: string,
    editorUserId: string,
    projectName: string,
    eventName: string,
    imageCount: number,
    adminName: string
  ): Promise<void> {
    try {
      logger.info('Sending re-edit requested notification', {
        tenantId,
        editorUserId,
        projectName,
        eventName,
        imageCount,
        adminName
      });
      
      // Create notification for the specific editor
      await NotificationService.create({
        userId: [editorUserId],
        tenantId,
        type: NOTIFICATION_TYPES.RE_EDIT_REQUESTED,
        title: `Re-edit requested for ${imageCount} image${imageCount !== 1 ? 's' : ''}`,
        message: `${adminName} requested re-edit for ${imageCount} image${imageCount !== 1 ? 's' : ''} in ${eventName} (${projectName})`,
        data: {
          adminName,
          projectName,
          eventName,
          imageCount,
        },
        actionUrl: `/albums`,
      });
    } catch (error: any) {
      logger.error('Error sending re-edit requested notification', {
        tenantId,
        editorUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify admins when editor uploads images
   */
  static async notifyImagesUploaded(
    tenantId: string,
    editorName: string,
    projectName: string,
    eventName: string,
    imageCount: number,
    excludeUserId?: string
  ): Promise<void> {
    try {
      logger.info('Sending images uploaded notification', {
        tenantId,
        editorName,
        projectName,
        eventName,
        imageCount,
        excludeUserId
      });
      
      // Get all admin users for this tenant
      let adminUsers = await this.getAdminUsers(tenantId);

      // Exclude the user who performed the action
      if (excludeUserId) {
        adminUsers = adminUsers.filter(admin => admin.userId !== excludeUserId);
      }

      if (adminUsers.length === 0) {
        logger.debug('No other admin users to notify for image upload', { tenantId, excludeUserId });
        return;
      }

      const userIds = adminUsers.map(u => u.userId);

      // Create notification (already sends via Socket.io)
      await NotificationService.create({
        userId: userIds,
        tenantId,
        type: NOTIFICATION_TYPES.IMAGES_UPLOADED,
        title: `${imageCount} images uploaded`,
        message: `${editorName} uploaded ${imageCount} image${imageCount !== 1 ? 's' : ''} for ${eventName} in project ${projectName}`,
        data: {
          editorName,
          projectName,
          eventName,
          imageCount,
        },
        actionUrl: `/events`,
      });

      logger.info('Sent images uploaded notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending images uploaded notification', {
        tenantId,
        error: error.message
      });
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
      const tenantId = event.tenantId;
      const eventId = event.clientEventId;
      
      logger.info('Sending shoot in progress notification', {
        tenantId,
        eventId,
        projectName
      });
      
      // Get event name from Event model
      const eventData = await Event.findOne({ eventId: event.eventId });
      const eventName = eventData?.eventDesc || 'event';

      // Get all admin users for this tenant
      const adminUsers = await this.getAdminUsers(tenantId);

      if (adminUsers.length === 0) {
        logger.warn('No admin users found for tenant', { tenantId, eventId });
        return;
      }

      const userIds = adminUsers.map((user) => user.userId);

      // Create notification (already sends via Socket.io)
      const notification = await NotificationService.create({
        userId: userIds,
        tenantId,
        type: NOTIFICATION_TYPES.SHOOT_IN_PROGRESS,
        title: 'Shoot Started',
        message: `${eventName} shoot is now in progress for project ${projectName}`,
        data: {
          eventId,
          projectId: event.projectId,
          eventName,
          projectName,
        },
        actionUrl: `/projects`,
      });

      logger.info('Sent shoot in progress notifications', {
        tenantId,
        eventId,
        recipientCount: notification.length
      });
    } catch (error: any) {
      logger.error('Error sending shoot in progress notification', {
        tenantId: event.tenantId,
        eventId: event.clientEventId,
        error: error.message
      });
    }
  }

  /**
   * Notify admins when editor completes re-edit and reuploads images
   */
  static async notifyReEditCompleted(
    tenantId: string,
    editorName: string,
    projectName: string,
    eventName: string,
    imageCount: number
  ): Promise<void> {
    try {
      logger.info('Sending re-edit completed notification', {
        tenantId,
        editorName,
        projectName,
        eventName,
        imageCount
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for re-edit completion notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.RE_EDIT_COMPLETED,
          title: 'Re-Edited Images Uploaded',
          message: `${editorName} has uploaded ${imageCount} re-edited image${imageCount !== 1 ? 's' : ''} for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent re-edit completion notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending re-edit completion notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when client starts selecting photos
   */
  static async notifyClientSelectionStarted(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string
  ): Promise<void> {
    try {
      logger.info('Sending client selection started notification', {
        tenantId,
        clientName,
        projectName,
        eventName
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for client selection notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.CLIENT_SELECTION_STARTED,
          title: 'Client Selection Started',
          message: `${clientName} has started selecting photos for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent client selection started notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending client selection started notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when client reaches 50% selection
   */
  static async notifyClientSelection50Percent(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string,
    selectedCount: number,
    totalCount: number
  ): Promise<void> {
    try {
      logger.info('Sending 50% selection notification', {
        tenantId,
        clientName,
        projectName,
        eventName,
        selectedCount,
        totalCount
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for 50% selection notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.CLIENT_SELECTION_50_PERCENT,
          title: '50% Photos Selected',
          message: `${clientName} has selected ${selectedCount} of ${totalCount} photos (50%) for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent 50% selection notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending 50% selection notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when client selects 100% of photos but hasn't finalized
   */
  static async notifyClientSelection100Percent(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string,
    totalCount: number
  ): Promise<void> {
    try {
      logger.info('Sending 100% selection notification', {
        tenantId,
        clientName,
        projectName,
        eventName,
        totalCount
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for 100% selection notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.CLIENT_SELECTION_100_PERCENT,
          title: 'All Photos Selected',
          message: `${clientName} has selected all ${totalCount} photos for ${eventName} in ${projectName}, but final decision not sent yet`,
        });
      }

      logger.info('Sent 100% selection notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending 100% selection notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when client finalizes their selection
   */
  static async notifyClientSelectionFinalized(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string,
    selectedCount: number
  ): Promise<void> {
    try {
      logger.info('Sending selection finalized notification', {
        tenantId,
        clientName,
        projectName,
        eventName,
        selectedCount
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for selection finalized notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.CLIENT_SELECTION_FINALIZED,
          title: 'Client Selection Finalized',
          message: `${clientName} has finalized their selection of ${selectedCount} photo${selectedCount !== 1 ? 's' : ''} for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent selection finalized notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending selection finalized notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins to assign designer after client selection is finalized
   */
  static async notifyAssignDesignerAfterSelection(
    tenantId: string,
    projectName: string,
    eventName: string,
    selectedCount: number
  ): Promise<void> {
    try {
      logger.info('Sending assign designer reminder notification', {
        tenantId,
        projectName,
        eventName,
        selectedCount
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for designer assignment notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.ASSIGN_DESIGNER_AFTER_SELECTION,
          title: 'Assign Designer Needed',
          message: `Client selection is complete for ${eventName} in ${projectName} (${selectedCount} photo${selectedCount !== 1 ? 's' : ''} selected). Please assign a designer to start album design.`,
        });
      }

      logger.info('Sent designer assignment reminder notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending designer assignment notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when designer uploads album PDF
   */
  static async notifyAlbumPdfUploaded(
    tenantId: string,
    designerName: string,
    projectName: string,
    eventNames: string,
    pdfCount: number,
    excludeUserId?: string
  ): Promise<void> {
    try {
      logger.info('Sending album PDF uploaded notification', {
        tenantId,
        designerName,
        projectName,
        eventNames,
        pdfCount,
        excludeUserId
      });
      
      // Get all admin users
      let adminUsers = await this.getAdminUsers(tenantId);
      
      // Exclude the user who performed the action
      if (excludeUserId) {
        adminUsers = adminUsers.filter(admin => admin.userId !== excludeUserId);
      }
      
      if (adminUsers.length === 0) {
        logger.debug('No other admin users to notify for album PDF upload', { tenantId, excludeUserId });
        return;
      }

      // Send notification to each admin (except the one who uploaded)
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.ALBUM_PDF_UPLOADED,
          title: 'Album PDF Uploaded',
          message: `${designerName} has uploaded ${pdfCount} album PDF${pdfCount !== 1 ? 's' : ''} for ${eventNames} in ${projectName}`,
        });
      }

      logger.info('Sent album PDF upload notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending album PDF upload notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins when customer starts reviewing album PDF
   */
  static async notifyCustomerAlbumReviewStarted(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string
  ): Promise<void> {
    try {
      logger.info('Sending customer album review started notification', {
        tenantId,
        clientName,
        projectName,
        eventName
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      if (adminUsers.length === 0) {
        logger.warn('No admin users found for album review notification', { tenantId });
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.CUSTOMER_ALBUM_REVIEW_STARTED,
          title: 'Customer Viewing Album',
          message: `${clientName} has started reviewing the album for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent customer album review notifications', {
        tenantId,
        recipientCount: adminUsers.length
      });
    } catch (error: any) {
      logger.error('Error sending album review notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify admins and designer when customer approves album
   */
  static async notifyAlbumApprovedByCustomer(
    tenantId: string,
    clientName: string,
    projectName: string,
    eventName: string,
    designerMemberId?: string
  ): Promise<void> {
    try {
      logger.info('Sending album approved by customer notification', {
        tenantId,
        clientName,
        projectName,
        eventName,
        designerMemberId
      });
      
      // Get all admin users
      const adminUsers = await this.getAdminUsers(tenantId);
      
      // Send notification to admins
      for (const admin of adminUsers) {
        await NotificationService.create({
          userId: admin.userId,
          tenantId,
          type: NOTIFICATION_TYPES.ALBUM_APPROVED_BY_CUSTOMER,
          title: 'Album Approved by Customer',
          message: `${clientName} has approved the album for ${eventName} in ${projectName}`,
        });
      }

      logger.info('Sent album approval notifications to admins', {
        tenantId,
        recipientCount: adminUsers.length
      });

      // Notify the designer if assigned
      if (designerMemberId) {
        const designerMember = await Team.findOne({ memberId: designerMemberId });
        if (designerMember?.userId) {
          await NotificationService.create({
            userId: designerMember.userId,
            tenantId,
            type: NOTIFICATION_TYPES.ALBUM_APPROVED_BY_CUSTOMER,
            title: 'Album Approved by Customer',
            message: `${clientName} has approved the album for ${eventName} in ${projectName}`,
          });
          
          logger.info('Sent album approval notification to designer', {
            tenantId,
            designerUserId: designerMember.userId
          });
        }
      }
    } catch (error: any) {
      logger.error('Error sending album approval notification', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }
}
