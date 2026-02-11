import { useState } from 'react';
import styles from './RefreshButton.module.css';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      className={styles.refreshButton}
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh events"
    >
      <svg 
        className={`${styles.icon} ${isRefreshing ? styles.spinning : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        width="20" 
        height="20"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      <span>Refresh</span>
    </button>
  );
};
