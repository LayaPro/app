import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { toggleNotificationPanel } from '../../store/slices/uiSlice.js';
import styles from './NotificationPanel.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export const NotificationPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.notificationPanelOpen);

  // Dummy notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New project assigned',
      message: 'Wedding shoot at Grand Hotel - Client: Sarah & Mark',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: '2',
      title: 'Payment received',
      message: '$5,000 from Corporate Event project',
      time: '5 hours ago',
      isRead: false,
    },
    {
      id: '3',
      title: 'Equipment maintenance reminder',
      message: 'Sony A7S III lens cleaning due tomorrow',
      time: '1 day ago',
      isRead: true,
    },
    {
      id: '4',
      title: 'Team member added',
      message: 'Alex Chen joined as Camera Operator',
      time: '2 days ago',
      isRead: true,
    },
    {
      id: '5',
      title: 'Project deadline approaching',
      message: 'Music Video Edit due in 3 days',
      time: '3 days ago',
      isRead: true,
    },
  ];

  const handleMarkAllRead = () => {
    // TODO: Implement mark all as read logic
    console.log('Mark all as read');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={() => dispatch(toggleNotificationPanel())}
      />
      
      {/* Panel */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Notifications</h3>
          <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
            Mark all read
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.list}>
            {notifications.map((notification) => (
              <div key={notification.id} className={styles.item}>
                <div className={styles.itemContent}>
                  <div
                    className={`${styles.indicator} ${
                      notification.isRead ? styles.indicatorRead : styles.indicatorUnread
                    }`}
                  />
                  <div className={styles.itemText}>
                    <p
                      className={
                        notification.isRead ? styles.itemTitleRead : styles.itemTitle
                      }
                    >
                      {notification.title}
                    </p>
                    <p className={styles.itemMessage}>{notification.message}</p>
                    <p className={styles.itemTime}>{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
