import React from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  info?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  info,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${styles.checkboxWrapper} ${className}`}>
      <input
        {...props}
        type="checkbox"
        id={checkboxId}
        className={styles.checkbox}
      />
      {label && (
        <label htmlFor={checkboxId} className={styles.label}>
          {label}
          {info && (
            <span className={styles.info} title={info}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          )}
        </label>
      )}
    </div>
  );
};
