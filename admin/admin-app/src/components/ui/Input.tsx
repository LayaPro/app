import React, { useState, useRef, useEffect } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  info?: string;
  showCharCount?: boolean;
  allowNumbers?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  info,
  showCharCount = false,
  allowNumbers = true,
  className = '',
  required,
  maxLength,
  value,
  onChange,
  ...props
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Prevent numbers if allowNumbers is false
    if (!allowNumbers && /\d/.test(newValue)) {
      return; // Don't update if contains numbers
    }

    if (onChange) {
      onChange(e);
    }
  };

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={styles.inputGroup}>
      {label && (
        <div className={styles.labelRow}>
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
          {info && (
            <div className={styles.infoWrapper} ref={infoRef}>
              <button
                type="button"
                className={styles.infoButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowInfo(!showInfo);
                }}
                tabIndex={-1}
                aria-label="More information"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path d="M12 16v-4" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="1" />
                </svg>
              </button>
              {showInfo && (
                <div className={styles.infoTooltip}>
                  {info}
                </div>
              )}
            </div>
          )}
          {showCharCount && maxLength && (
            <span className={`${styles.charCount} ${currentLength >= maxLength ? styles.charCountLimit : ''}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          {...props}
          value={value}
          onChange={handleInputChange}
          maxLength={maxLength}
          className={`${styles.input} ${icon ? styles.withIcon : ''} ${error ? styles.error : ''} ${className}`}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
