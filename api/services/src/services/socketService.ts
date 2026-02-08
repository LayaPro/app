import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('SocketService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

let io: Server | null = null;

export const initializeSocketIO = (httpServer: HTTPServer) => {
  // Whitelisted origins for WebSocket connections
  const allowedOrigins = [
    'http://localhost:5173', // Customer app (dev)
    'http://localhost:5174', // Admin app (dev)
    'http://localhost:3002', // Marketing app (dev)
    process.env.FRONTEND_URL, // Legacy env variable
    process.env.CUSTOMER_APP_URL, // Production customer app
    process.env.ADMIN_APP_URL, // Production admin app
    process.env.MARKETING_APP_URL // Production marketing app
  ].filter((origin): origin is string => Boolean(origin));

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Socket connection attempted without token');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId || decoded.id;
      socket.user = decoded;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed with invalid token');
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('User connected', { userId: socket.userId, tenantId: socket.user?.tenantId });

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.debug('User joined room', { userId: socket.userId, room: `user:${socket.userId}` });
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected', { userId: socket.userId, reason });
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  logger.info('Socket.IO server initialized', {
    cors: process.env.CLIENT_URL || 'http://localhost:5173',
    pingTimeout: 60000,
    pingInterval: 25000
  });
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Send notification to specific user
export const sendNotificationToUser = (userId: string, notification: any) => {
  if (!io) {
    logger.error('Attempted to send notification but Socket.IO not initialized', { userId });
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  logger.debug('Notification sent to user', { userId, title: notification.title, type: notification.type });
};

// Send notification to multiple users
export const sendNotificationToUsers = (userIds: string[], notification: any) => {
  if (!io) {
    logger.error('Attempted to send notifications but Socket.IO not initialized', { userCount: userIds.length });
    return;
  }

  userIds.forEach(userId => {
    io!.to(`user:${userId}`).emit('notification', notification);
  });
  logger.debug('Notification sent to multiple users', { 
    userCount: userIds.length, 
    title: notification.title,
    type: notification.type 
  });
};

// Broadcast to all connected users
export const broadcastNotification = (notification: any) => {
  if (!io) {
    logger.error('Attempted to broadcast notification but Socket.IO not initialized');
    return;
  }

  io.emit('notification', notification);
  logger.info('Broadcast notification sent', { title: notification.title, type: notification.type });
};

// Emit event status update to tenant users
export const emitEventStatusUpdate = (tenantId: string, eventData: any) => {
  if (!io) {
    logger.error('Attempted to emit event status update but Socket.IO not initialized', { tenantId });
    return;
  }

  // Emit to all users in the tenant (frontend should filter by tenantId)
  io.emit('event:statusUpdate', {
    tenantId,
    ...eventData
  });
  logger.debug('Event status update emitted', { 
    tenantId, 
    clientEventId: eventData.clientEventId,
    statusCode: eventData.statusCode 
  });
};
