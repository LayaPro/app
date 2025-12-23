import React from 'react';
import styles from './CollapsibleCard.module.css';

interface CollapsibleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  icon,
  title,
  subtitle,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className={styles.card}>
      <button
        className={styles.cardHeader}
        onClick={onToggle}
      >
        <div className={styles.cardHeaderContent}>
          {icon}
          <div>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardSubtitle}>{subtitle}</p>
          </div>
        </div>
        <svg
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${styles.cardContent} ${isExpanded ? styles.cardContentExpanded : ''}`}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};
