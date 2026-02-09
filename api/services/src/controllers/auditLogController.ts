import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
import Project from '../models/project';
import ClientEvent from '../models/clientEvent';

// Audit log schema (matches Winston MongoDB structure)
interface AuditLog {
  _id: mongoose.Types.ObjectId;
  timestamp: Date;
  level: string;
  message: string;
  meta: {
    action: string;
    entityType: string;
    entityId: string;
    tenantId?: string;
    userId?: string;
    performedBy?: string;
    changes?: any;
    metadata?: any;
    ipAddress?: string;
  };
}

export const auditLogController = {
  // Get all audit logs with pagination
  getAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Get the audit_logs collection
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      const auditLogsCollection = db.collection('audit_logs');

      // Get total count
      const total = await auditLogsCollection.countDocuments();

      // If no logs exist, return sample data for development
      if (total === 0) {
        const sampleLogs = [
          {
            id: '1',
            userId: '1',
            userName: 'John Doe',
            action: 'LOGIN',
            entityType: 'User',
            entityId: '1',
            description: 'User logged in successfully',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date(),
          },
          {
            id: '2',
            userId: '1',
            userName: 'John Doe',
            action: 'CREATE',
            entityType: 'Project',
            entityId: '123',
            description: 'Created new project',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date(Date.now() - 3600000),
          },
        ];

        return res.json({
          logs: sampleLogs,
          total: sampleLogs.length,
          totalPages: 1,
          currentPage: 1,
        });
      }

      // Get paginated logs
      const logs = await auditLogsCollection
        .find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Collect all user IDs and entity IDs to fetch names
      const userIds = new Set<string>();
      const projectIds = new Set<string>();
      const clientEventIds = new Set<string>();
      const entityUserIds = new Set<string>();

      logs.forEach((log: any) => {
        const metadata = log.metadata || {};
        if (metadata.performedBy) userIds.add(metadata.performedBy);
        
        // Collect entity IDs based on type
        if (metadata.entityId) {
          if (metadata.entityType === 'Project') {
            projectIds.add(metadata.entityId);
          } else if (metadata.entityType === 'ClientEvent') {
            clientEventIds.add(metadata.entityId);
          } else if (metadata.entityType === 'User') {
            entityUserIds.add(metadata.entityId);
          }
        }
      });

      // Fetch users, projects, and client events in bulk
      const users = await User.find({ userId: { $in: Array.from(userIds) } })
        .select('userId firstName lastName email')
        .lean();
      
      const entityUsers = await User.find({ userId: { $in: Array.from(entityUserIds) } })
        .select('userId firstName lastName email')
        .lean();
      
      const projects = await Project.find({ projectId: { $in: Array.from(projectIds) } })
        .select('projectId projectName')
        .lean();
      
      const clientEvents = await ClientEvent.find({ clientEventId: { $in: Array.from(clientEventIds) } })
        .select('clientEventId eventId projectId')
        .lean();
      
      // Get event and project data for client events
      const eventIds = [...new Set(clientEvents.map((e: any) => e.eventId))];
      const clientEventProjectIds = [...new Set(clientEvents.map((e: any) => e.projectId))];
      
      const Event = mongoose.connection.db?.collection('events');
      const events = Event ? await Event.find({ eventId: { $in: eventIds } }).toArray() : [];
      
      // Fetch additional projects if needed
      const additionalProjects = await Project.find({ 
        projectId: { $in: clientEventProjectIds.filter(id => !projectIds.has(id)) } 
      }).select('projectId projectName').lean();
      
      // Add to project map
      additionalProjects.forEach((p: any) => {
        projectMap.set(p.projectId, p.projectName);
      });
      
      // Create event map
      const eventMap = new Map(
        events.map((e: any) => [e.eventId, e.eventDesc || e.eventCode])
      );

      // Create lookup maps
      const userMap = new Map(
        users.map((u: any) => [u.userId, `${u.firstName} ${u.lastName}`])
      );
      
      const entityUserMap = new Map(
        entityUsers.map((u: any) => [u.userId, `${u.firstName} ${u.lastName}`])
      );
      
      const projectMap = new Map(
        projects.map((p: any) => [p.projectId, p.projectName])
      );
      
      const clientEventMap = new Map(
        clientEvents.map((e: any) => {
          const projectName = projectMap.get(e.projectId);
          const eventName = eventMap.get(e.eventId);
          return [e.clientEventId, `${projectName || 'Project'} - ${eventName || 'Event'}`];
        })
      );

      // Transform logs to match frontend interface
      const transformedLogs = logs.map((log: any) => {
        // Winston stores data in metadata field
        const metadata = log.metadata || {};
        const action = metadata.action || 'SYSTEM_EVENT';
        const entityType = metadata.entityType || '-';
        const performedById = metadata.performedBy || 'System';
        const performedByName = userMap.get(performedById) || performedById;
        
        // Build description from available data
        let description = '';
        const changes = metadata.changes || {};
        const changedFields = Object.keys(changes);
        
        // Field labels for readable descriptions
        const fieldLabels: Record<string, string> = {
          eventDeliveryStatusId: 'delivery status',
          firstName: 'first name',
          lastName: 'last name',
          email: 'email',
          roleName: 'role',
          projectName: 'project name',
          fromDatetime: 'start time',
          toDatetime: 'end time',
          phoneNumber: 'phone number',
          status: 'status',
          amount: 'amount',
          description: 'description',
          quantity: 'quantity',
          equipmentName: 'equipment name',
          expenseName: 'expense name',
        };
        
        // Get entity name for description
        let entityName = null;
        if (metadata.entityId) {
          switch (entityType) {
            case 'Project':
              entityName = projectMap.get(metadata.entityId);
              break;
            case 'ClientEvent':
              entityName = clientEventMap.get(metadata.entityId);
              break;
            case 'User':
              entityName = entityUserMap.get(metadata.entityId);
              break;
          }
        }
        
        // Generate meaningful description based on action, entity type, and changes
        if (action === 'TENANT_CREATED') {
          description = `Created ${entityType.toLowerCase()}`;
          if (entityName) {
            description += ` "${entityName}"`;
          }
        } else if (action === 'TENANT_DELETED') {
          description = `Deleted ${entityType.toLowerCase()}`;
          if (entityName) {
            description += ` "${entityName}"`;
          }
        } else if (action === 'TENANT_UPDATED') {
          // Generate specific descriptions based on entity type and changes
          switch (entityType) {
            case 'ClientEvent':
              if (changedFields.includes('eventDeliveryStatusId')) {
                description = 'Changed delivery status';
              } else if (changedFields.includes('fromDatetime') || changedFields.includes('toDatetime')) {
                description = 'Updated event time';
              } else {
                description = 'Updated event details';
              }
              break;
              
            case 'Project':
              if (changedFields.includes('projectName')) {
                description = 'Renamed project';
              } else if (changedFields.includes('status')) {
                description = 'Changed project status';
              } else {
                description = 'Updated project';
              }
              break;
              
            case 'User':
              if (changedFields.includes('roleName')) {
                description = 'Changed user role';
              } else if (changedFields.includes('email')) {
                description = 'Updated email address';
              } else if (changedFields.includes('firstName') || changedFields.includes('lastName')) {
                description = 'Updated user name';
              } else {
                description = 'Updated user profile';
              }
              break;
              
            case 'Equipment':
              if (changedFields.includes('equipmentName')) {
                description = 'Renamed equipment';
              } else if (changedFields.includes('quantity')) {
                description = 'Updated equipment quantity';
              } else {
                description = 'Updated equipment';
              }
              break;
              
            case 'EventExpense':
              if (changedFields.includes('amount')) {
                description = 'Updated expense amount';
              } else if (changedFields.includes('expenseName')) {
                description = 'Renamed expense';
              } else {
                description = 'Updated expense';
              }
              break;
              
            case 'Organization':
              description = 'Updated organization settings';
              break;
              
            default:
              description = `Updated ${entityType.toLowerCase()}`;
          }
          
          // Add entity name
          if (entityName) {
            description += ` for "${entityName}"`;
          }
          
          // Add readable field list if multiple fields changed
          if (changedFields.length > 1) {
            const readableFields = changedFields
              .map(field => fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').toLowerCase())
              .join(', ');
            description += ` (${readableFields})`;
          }
        } else if (action === 'USER_CREATED') {
          description = 'Created new user';
          if (entityName) {
            description += ` "${entityName}"`;
          }
        } else if (action === 'USER_UPDATED') {
          description = 'Updated user';
          if (entityName) {
            description += ` "${entityName}"`;
          }
        } else if (action === 'USER_DELETED') {
          description = 'Deleted user';
          if (entityName) {
            description += ` "${entityName}"`;
          }
        } else if (action === 'PASSWORD_RESET') {
          description = 'Reset password';
        } else if (action === 'ROLE_CHANGED') {
          description = 'Changed user role';
        } else if (action === 'LOGIN_FAILED') {
          description = 'Failed login attempt';
        } else if (action === 'DATA_EXPORT') {
          description = 'Exported data';
        } else if (action === 'BULK_DELETE') {
          description = 'Performed bulk delete';
        } else {
          // Fallback to action name
          description = action.replace(/_/g, ' ').toLowerCase();
          description = description.charAt(0).toUpperCase() + description.slice(1);
        }

        return {
          id: log._id.toString(),
          userId: performedById,
          userName: performedByName,
          action: action,
          entityType: entityType,
          entityId: metadata.entityId || null,
          description: description,
          ipAddress: metadata.ipAddress?.replace('::ffff:', '') || '-',
          userAgent: metadata.userAgent || '',
          createdAt: log.timestamp || new Date(),
        };
      });

      res.json({
        logs: transformedLogs,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  },
};

export default auditLogController;
