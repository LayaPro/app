import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket, type Notification } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../utils/constants';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  testNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const { notifications: realtimeNotifications, clearNotifications } = useSocket(token);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data.notifications);

      const countResponse = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const countData = await countResponse.json();
      setUnreadCount(countData.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user, refreshNotifications]);

  // Add real-time notifications to the list
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      // Transform real-time notifications to ensure they have id field
      const transformedNotifications = realtimeNotifications.map((n: any) => ({
        ...n,
        id: n.id || n._id || n._id?.toString(),
      }));
      console.log('Adding real-time notifications:', transformedNotifications);
      setNotifications(prev => [...transformedNotifications, ...prev]);
      setUnreadCount(prev => prev + realtimeNotifications.length);
      clearNotifications();
    }
  }, [realtimeNotifications, clearNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [token]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      console.log('Deleting notification with ID:', id);
      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Delete failed:', error);
        return;
      }
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [token]);

  // Test notification (for development)
  const testNotification = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        testNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
