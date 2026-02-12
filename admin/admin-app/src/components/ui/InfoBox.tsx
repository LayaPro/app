import React from 'react';
import styles from './InfoBox.module.css';

interface InfoBoxProps {
  children: React.ReactNode;
  className?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ children, className }) => {
  return (
    <div className={`${styles.infoText} ${className || ''}`}>
      <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </div>
  );
};
