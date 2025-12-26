import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'medium', overlay = false }) => {
  if (overlay) {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.spinner} ${styles[size]}`}>
          <div className={styles.ring}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.spinner} ${styles[size]}`}>
      <div className={styles.ring}></div>
    </div>
  );
};
