# Notification System Documentation

## Overview
The notification system provides real-time notifications using Socket.io and persistent storage with MongoDB. It supports multi-tenant architecture and various notification types.

## Architecture

### Components
1. **Notification Model** (`/src/models/notification.ts`)
   - Stores notifications with multi-tenant isolation
   - Auto-expires read notifications after 30 days (TTL index)
   - Fields: userId, tenantId, type, title, message, data, read, actionUrl, readAt

2. **Socket.io Service** (`/src/services/socketService.ts`)
   - Real-time notification delivery
   - JWT authentication
   - User-specific rooms (`user:${userId}`)
   - Functions: `sendNotificationToUser()`, `sendNotificationToUsers()`, `broadcastNotification()`

3. **Notification Service** (`/src/services/notificationService.ts`)
   - CRUD operations for notifications
   - Creates notification in DB then broadcasts via Socket.io
   - Multi-tenant scoped queries

4. **Notification Utils** (`/src/services/notificationUtils.ts`)
   - High-level notification helpers for common use cases
   - Handles admin user lookups
   - Event name fetching from Event model

## Notification Types

### 1. ASSIGN_EDITOR_NEEDED
**Triggers when:**
- Event status changes to `AWAITING_EDITING` AND no editor is assigned
- Happens automatically when event is created or status is updated

**Recipients:** All active Admin users for the tenant

**Message:** "Please assign an editor to [Event Name] in project [Project Name]"

**Implementation locations:**
- `projectController.ts` - `createProjectWithDetails()` (when event created)
- `clientEventController.ts` - `updateClientEvent()` (when status updated)

### 2. ASSIGN_DESIGNER_NEEDED
**Triggers when:** Manually called (can be implemented similar to editor notification)

**Recipients:** All active Admin users for the tenant

**Message:** "Please assign a designer to [Event Name] in project [Project Name]"

### 3. ASSIGNED_TO_TASK
**Triggers when:**
- Editor is assigned to an event (`albumEditor` field updated)
- Designer is assigned to an event (`albumDesigner` field updated)

**Recipients:** The assigned user (editor or designer)

**Message:**
- Editor: "You've been assigned as editor for [Event Name] in project [Project Name] (Due: [Date])"
- Designer: "You've been assigned as album designer for [Event Name] in project [Project Name] (Due: [Date])"

**Implementation location:**
- `clientEventController.ts` - `updateClientEvent()` (when editor/designer assigned)

### 4. DUE_DATE_APPROACHING
**Status:** Not yet implemented

**Planned trigger:** Cron job checking for due dates approaching (1 day, 3 days before)

**Recipients:** Assigned editor/designer

**Message:** "[Event Name] editing is due in [X] days"

### 5. STATUS_CHANGED
**Status:** Not yet implemented

**Planned trigger:** When event status changes (could notify assigned team members)

**Recipients:** Assigned team members

**Message:** "[Event Name] status changed to [New Status]"

## How to Add New Notification Types

### Step 1: Add Type Constant
In `/src/services/notificationUtils.ts`:
```typescript
export const NOTIFICATION_TYPES = {
  // ... existing types
  YOUR_NEW_TYPE: 'YOUR_NEW_TYPE',
} as const;
```

### Step 2: Create Notification Function
In `/src/services/notificationUtils.ts`:
```typescript
static async notifyYourNewType(
  /* parameters */
): Promise<void> {
  try {
    // Determine recipients
    const recipients = [...]; // array of userIds
    
    // Create notification
    const notification = await NotificationService.create({
      userId: recipients,
      tenantId: tenantId,
      type: NOTIFICATION_TYPES.YOUR_NEW_TYPE,
      title: 'Your Title',
      message: 'Your message',
      data: {
        // Custom data
      },
      actionUrl: '/path/to/action',
    });

    // Send real-time notification
    if (notification.length > 0) {
      sendNotificationToUsers(recipients, notification[0]);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
```

### Step 3: Call Notification Function
Call your notification function where the event occurs:
```typescript
await NotificationUtils.notifyYourNewType(/* parameters */);
```

## Notification Data Structure

```typescript
{
  userId: string | string[],        // Recipient(s)
  tenantId: string,                 // For multi-tenant isolation
  type: string,                     // Notification type
  title: string,                    // Short title
  message: string,                  // Full message
  data?: any,                       // Custom data (event details, etc.)
  actionUrl?: string,               // Where to navigate on click
  read: boolean,                    // Read status (default: false)
  readAt?: Date,                    // When marked as read
}
```

## API Endpoints

- `GET /notifications` - Get user's notifications (supports `limit` and `unreadOnly` params)
- `GET /notifications/unread-count` - Get count of unread notifications
- `POST /notifications/:id/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete a notification
- `POST /notifications/test` - Create test notification (for development)

## Frontend Integration

### Hook: useSocket
```typescript
const { socket, connected, notifications, clearNotifications } = useSocket(token);
```

### Context: NotificationContext
```typescript
const {
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  refreshNotifications,
  testNotification
} = useNotifications();
```

### Component: NotificationDropdown
Displays bell icon with unread count badge and dropdown list.

## Multi-Tenant Considerations

- All notifications are scoped by `tenantId`
- Queries automatically filter by tenant
- Admin role lookup uses global role (`tenantId: '-1'`) but finds admins within specific tenant
- Socket rooms are user-specific, not tenant-specific

## Future Enhancements

1. **Cron Jobs for Due Date Reminders**
   - Daily check for approaching due dates
   - Notify editors/designers 3 days, 1 day before

2. **Notification Preferences**
   - Allow users to configure which notifications they want to receive
   - Email notifications in addition to in-app

3. **Notification History**
   - Archive read notifications instead of deleting
   - Allow users to view notification history

4. **Rich Notifications**
   - Support for images, actions, etc.
   - Push notifications for mobile apps

5. **Batch Notifications**
   - Group similar notifications
   - Daily digest emails
