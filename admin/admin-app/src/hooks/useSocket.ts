import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  createdAt: string;
  read: boolean;
}

export const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Connect to Socket.io
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected with same token
    if (socket && socket.connected) {
      return;
    }

    console.log('🔌 Connecting to Socket.io...');
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.io connected');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('📨 Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    connected,
    notifications,
    clearNotifications
  };
};
