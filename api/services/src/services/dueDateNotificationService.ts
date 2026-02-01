import ClientEvent from '../models/clientEvent';
import Project from '../models/project';
import User from '../models/user';
import Team from '../models/team';
import Role from '../models/role';
import { NotificationService } from './notificationService';

/**
 * Service for checking and sending due date notifications
 * Checks for editing due dates, album design due dates, and project delivery due dates
 * that are approaching within the specified number of days
 */
class DueDateNotificationService {
  private readonly DAYS_BEFORE = 2; // Notify 2 days before due date

  /**
   * Get all admin users for a tenant
   */
  private async getAdminUsers(tenantId: string): Promise<any[]> {
    const adminRole = await Role.findOne({ roleName: 'Admin' });
    if (!adminRole) return [];

    const adminUsers = await User.find({
      tenantId,
      roleId: adminRole.roleId,
      isActive: true
    });

    return adminUsers;
  }

  /**
   * Check if a date is approaching (within DAYS_BEFORE days from now)
   */
  private isDateApproaching(dueDate: Date): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Calculate days difference
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return true if due date is exactly DAYS_BEFORE days away
    return diffDays === this.DAYS_BEFORE;
  }

  /**
   * Format date for display in notifications
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Check and notify for editing due dates
   */
  async checkEditingDueDates(): Promise<void> {
    try {
      console.log('[DueDateNotification] Checking editing due dates...');

      // Get all events with editing due dates
      const events = await ClientEvent.find({
        editingDueDate: { $exists: true, $ne: null }
      }).populate('projectId');

      for (const event of events) {
        if (!event.editingDueDate || !this.isDateApproaching(event.editingDueDate)) {
          continue;
        }

        // Get project details
        const project = await Project.findOne({ projectId: event.projectId });
        if (!project) continue;

        const tenantId = event.tenantId;
        const projectName = project.projectName || 'Unknown Project';
        const dueDateFormatted = this.formatDate(event.editingDueDate);

        // Get event name
        const eventName = await this.getEventName(event.eventId, tenantId);

        // Notify admins
        const adminUsers = await this.getAdminUsers(tenantId);
        for (const admin of adminUsers) {
          await NotificationService.create({
            userId: admin.userId,
            tenantId,
            type: 'DUE_DATE_APPROACHING',
            title: '⏰ Editing Due Date Approaching',
            message: `Editing for "${eventName}" in project "${projectName}" is due on ${dueDateFormatted} (in ${this.DAYS_BEFORE} days)`,
            data: { clientEventId: event.clientEventId, entityType: 'client_event' }
          });
        }

        // Notify assigned editor if exists
        if (event.albumEditor) {
          const editorTeam = await Team.findOne({ memberId: event.albumEditor });
          if (editorTeam && editorTeam.userId) {
            await NotificationService.create({
              userId: editorTeam.userId,
              tenantId,
              type: 'DUE_DATE_APPROACHING',
              title: '⏰ Your Editing Deadline Approaching',
              message: `Your editing work for "${eventName}" in project "${projectName}" is due on ${dueDateFormatted} (in ${this.DAYS_BEFORE} days)`,
              data: { clientEventId: event.clientEventId, entityType: 'client_event' }
            });
          }
        }

        console.log(`[DueDateNotification] Notified about editing due date for event ${event.clientEventId}`);
      }
    } catch (error) {
      console.error('[DueDateNotification] Error checking editing due dates:', error);
    }
  }

  /**
   * Check and notify for album design due dates
   */
  async checkAlbumDesignDueDates(): Promise<void> {
    try {
      console.log('[DueDateNotification] Checking album design due dates...');

      // Get all events with album design due dates
      const events = await ClientEvent.find({
        albumDesignDueDate: { $exists: true, $ne: null }
      }).populate('projectId');

      for (const event of events) {
        if (!event.albumDesignDueDate || !this.isDateApproaching(event.albumDesignDueDate)) {
          continue;
        }

        // Get project details
        const project = await Project.findOne({ projectId: event.projectId });
        if (!project) continue;

        const tenantId = event.tenantId;
        const projectName = project.projectName || 'Unknown Project';
        const dueDateFormatted = this.formatDate(event.albumDesignDueDate);

        // Get event name
        const eventName = await this.getEventName(event.eventId, tenantId);

        // Notify admins
        const adminUsers = await this.getAdminUsers(tenantId);
        for (const admin of adminUsers) {
          await NotificationService.create({
            userId: admin.userId,
            tenantId,
            type: 'DUE_DATE_APPROACHING',
            title: '⏰ Album Design Due Date Approaching',
            message: `Album design for "${eventName}" in project "${projectName}" is due on ${dueDateFormatted} (in ${this.DAYS_BEFORE} days)`,
            data: { clientEventId: event.clientEventId, entityType: 'client_event' }
          });
        }

        // Notify assigned designer if exists
        if (event.albumDesigner) {
          const designerTeam = await Team.findOne({ memberId: event.albumDesigner });
          if (designerTeam && designerTeam.userId) {
            await NotificationService.create({
              userId: designerTeam.userId,
              tenantId,
              type: 'DUE_DATE_APPROACHING',
              title: '⏰ Your Album Design Deadline Approaching',
              message: `Your album design work for "${eventName}" in project "${projectName}" is due on ${dueDateFormatted} (in ${this.DAYS_BEFORE} days)`,
              data: { clientEventId: event.clientEventId, entityType: 'client_event' }
            });
          }
        }

        console.log(`[DueDateNotification] Notified about album design due date for event ${event.clientEventId}`);
      }
    } catch (error) {
      console.error('[DueDateNotification] Error checking album design due dates:', error);
    }
  }

  /**
   * Check and notify for project delivery due dates
   */
  async checkProjectDeliveryDueDates(): Promise<void> {
    try {
      console.log('[DueDateNotification] Checking project delivery due dates...');

      // Get all projects with delivery due dates
      const projects = await Project.find({
        deliveryDueDate: { $exists: true, $ne: null }
      });

      for (const project of projects) {
        if (!project.deliveryDueDate || !this.isDateApproaching(project.deliveryDueDate)) {
          continue;
        }

        const tenantId = project.tenantId;
        const projectName = project.projectName || 'Unknown Project';
        const dueDateFormatted = this.formatDate(project.deliveryDueDate);

        // Notify admins
        const adminUsers = await this.getAdminUsers(tenantId);
        for (const admin of adminUsers) {
          await NotificationService.create({
            userId: admin.userId,
            tenantId,
            type: 'DUE_DATE_APPROACHING',
            title: '⏰ Project Delivery Due Date Approaching',
            message: `Project "${projectName}" delivery is due on ${dueDateFormatted} (in ${this.DAYS_BEFORE} days)`,
            data: { projectId: project.projectId, entityType: 'project' }
          });
        }

        console.log(`[DueDateNotification] Notified about delivery due date for project ${project.projectId}`);
      }
    } catch (error) {
      console.error('[DueDateNotification] Error checking project delivery due dates:', error);
    }
  }

  /**
   * Get event name from Event master data
   */
  private async getEventName(eventId: string, tenantId: string): Promise<string> {
    try {
      const Event = require('../models/event').default;
      const event = await Event.findOne({ eventId, tenantId });
      const name = event?.eventDesc || 'Unknown Event';
      return name;
    } catch (error) {
      console.error('[DueDateNotification] Error getting event name:', error);
      return 'Unknown Event';
    }
  }

  /**
   * Run all due date checks
   */
  async checkAllDueDates(): Promise<void> {
    console.log('[DueDateNotification] Starting due date checks...');
    await Promise.all([
      this.checkEditingDueDates(),
      this.checkAlbumDesignDueDates(),
      this.checkProjectDeliveryDueDates()
    ]);
    console.log('[DueDateNotification] Completed due date checks');
  }
}

export default new DueDateNotificationService();
