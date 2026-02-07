import winston from 'winston';
import 'winston-mongodb';

// Audit-specific logger that writes to MongoDB
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write audit logs to MongoDB
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI || '',
      collection: 'audit_logs',
      options: { 
        useUnifiedTopology: true,
        dbName: 'flomingo_db' 
      },
      level: 'info',
      storeHost: true,
      capped: false,
      expireAfterSeconds: 7776000, // Keep for 90 days (3 months), then auto-delete
      // MongoDB TTL index will automatically clean up old logs
    }),
    
    // Also write to file as backup
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'info',
    }),
  ],
});

// Helper function to log audit events
export const logAudit = (data: {
  action: string;
  entityType: string;
  entityId: string;
  tenantId?: string;
  userId?: string;
  performedBy?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
}) => {
  auditLogger.info('AUDIT', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Critical audit event types
 * 
 * ONLY log events that:
 * - Change critical business data (tenant, subscriptions, security)
 * - Are required for compliance/security reviews
 * - Help investigate incidents
 * 
 * DO NOT log:
 * - Read operations (GET requests)
 * - Search/filter operations
 * - UI interactions
 * - Debug information
 */
export const auditEvents = {
  // Tenant Management (Critical)
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  TENANT_DELETED: 'TENANT_DELETED',
  TENANT_STATUS_CHANGED: 'TENANT_STATUS_CHANGED',
  
  // Subscription Changes (Critical)
  PLAN_UPGRADED: 'PLAN_UPGRADED',
  PLAN_DOWNGRADED: 'PLAN_DOWNGRADED',
  
  // User Security Events (Critical - add when implementing)
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  LOGIN_FAILED: 'LOGIN_FAILED', // Only log failures, not success
  
  // Data Security (Critical - add when implementing)
  DATA_EXPORT: 'DATA_EXPORT',
  BULK_DELETE: 'BULK_DELETE',
};

export default auditLogger;
