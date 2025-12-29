import React from 'react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  icon?: React.ReactNode;
  size?: 'default' | 'compact';
  className?: string;
}

const defaultIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  icon = defaultIcon,
  size = 'default',
  className = '',
  ...rest
}) => {
  const classes = [styles.badge, size === 'compact' ? styles.compact : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>{label}</span>
    </span>
  );
};
