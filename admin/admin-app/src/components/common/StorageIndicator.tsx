import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { storageApi } from '../../services/api.js';
import { useAppDispatch } from '../../store/index.js';
import { toggleStorageBreakdownModal } from '../../store/slices/uiSlice.js';
import styles from './StorageIndicator.module.css';

interface StorageStats {
  storageUsedGB: number;
  storageLimitGB: number;
  percentageUsed: number;
  remainingGB: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  planName?: string;
}

export const StorageIndicator: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [storage, setStorage] = useState<StorageStats>({
    storageUsedGB: 0,
    storageLimitGB: 0,
    percentageUsed: 0,
    remainingGB: 0,
    isNearLimit: false,
    isOverLimit: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageStats = async () => {
      if (!user?.tenantId) return;

      try {
        const response = await storageApi.getStats(user.tenantId);
        setStorage(response);
      } catch (error) {
        console.error('Error fetching storage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageStats();

    // Listen for storage update events
    const handleStorageUpdate = () => {
      console.log('[StorageIndicator] Received storage update event, refreshing...');
      fetchStorageStats();
    };

    window.addEventListener('storageUpdated', handleStorageUpdate);
    return () => window.removeEventListener('storageUpdated', handleStorageUpdate);
  }, [user?.tenantId]);

  if (loading) {
    return (
      <div className={styles.storageIndicator}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (storage.isOverLimit) return '#ef4444'; // red
    if (storage.isNearLimit) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const formatStorageUsed = () => {
    if (storage.storageUsedGB < 1) {
      const storageUsedMB = storage.storageUsedGB * 1024;
      return `${storageUsedMB.toFixed(2)} MB`;
    }
    return `${storage.storageUsedGB.toFixed(2)} GB`;
  };

  return (
    <div className={styles.storageIndicator} onClick={() => dispatch(toggleStorageBreakdownModal())}>
      {storage.planName && (
        <div className={styles.planBadgeContainer}>
          <span className={styles.planBadge}>{storage.planName}</span>
        </div>
      )}
      
      <div className={styles.storageDetails}>
        <div className={styles.storageText}>
          <span className={styles.storageUsed} style={{ color: getStatusColor() }}>
            {formatStorageUsed()}
          </span>
          <span className={styles.storageSeparator}>/</span>
          <span className={styles.storageLimit}>
            {storage.storageLimitGB} GB Used
          </span>
        </div>
        
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar}
            style={{ 
              width: `${Math.min(storage.percentageUsed, 100)}%`,
              backgroundColor: getStatusColor()
            }}
          ></div>
        </div>

        {storage.isOverLimit && (
          <div className={styles.warningText} style={{ color: '#ef4444' }}>
            Storage limit exceeded!
          </div>
        )}
        {storage.isNearLimit && !storage.isOverLimit && (
          <div className={styles.warningText} style={{ color: '#f59e0b' }}>
            {storage.remainingGB.toFixed(2)} GB remaining
          </div>
        )}
      </div>
    </div>
  );
};
