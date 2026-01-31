import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationDropdown.module.css';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCount = useRef(0);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testNotification
  } = useNotifications();

  // Trigger ring animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && unreadCount > 0) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button
        className={`${styles.notificationButton} ${isRinging ? styles.ring : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            {/* Test button for development */}
            <button
              className={styles.testButton}
              onClick={testNotification}
              title="Send test notification"
            >
              Test
            </button>
            {unreadCount > 0 && (
              <button className={styles.markAllButton} onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {loading && (
              <div className={styles.loading}>Loading...</div>
            )}

            {!loading && (!notifications || notifications.length === 0) && (
              <div className={styles.empty}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications</p>
              </div>
            )}

            {!loading && notifications && notifications.slice(0, 15).map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationContent}>
                  <div className={styles.notificationTitle}>{notification.title}</div>
                  <div className={styles.notificationMessage}>{notification.message}</div>
                  <div className={styles.notificationTime}>{formatTime(notification.createdAt)}</div>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(e, notification.id)}
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
