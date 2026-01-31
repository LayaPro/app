import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

let io: Server | null = null;

export const initializeSocketIO = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId || decoded.id;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      console.log(`👤 User ${socket.userId} joined their room`);
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ User ${socket.userId} disconnected: ${reason}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('🚀 Socket.IO server initialized');
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
    console.error('Socket.IO not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`📨 Notification sent to user ${userId}:`, notification.title);
};

// Send notification to multiple users
export const sendNotificationToUsers = (userIds: string[], notification: any) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  userIds.forEach(userId => {
    io!.to(`user:${userId}`).emit('notification', notification);
  });
  console.log(`📨 Notification sent to ${userIds.length} users:`, notification.title);
};

// Broadcast to all connected users
export const broadcastNotification = (notification: any) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  io.emit('notification', notification);
  console.log(`📢 Broadcast notification:`, notification.title);
};
