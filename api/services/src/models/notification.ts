import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  tenantId: string;
  type: string; // DUE_DATE, ASSIGNMENT, STATUS_CHANGE, COMMENT, etc.
  title: string;
  message: string;
  data?: any; // Additional data (projectId, eventId, etc.)
  read: boolean;
  actionUrl?: string; // Where to navigate when clicked
  createdAt: Date;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  actionUrl: {
    type: String
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
NotificationSchema.index({ userId: 1, tenantId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days
NotificationSchema.index({ readAt: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
  partialFilterExpression: { read: true }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
