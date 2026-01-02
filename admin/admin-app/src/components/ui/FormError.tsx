import React from 'react';
import styles from './FormError.module.css';

interface FormErrorProps {
  message?: string | null;
  onClose?: () => void;
}

export const FormError: React.FC<FormErrorProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className={styles.errorBanner} role="alert">
      <div className={styles.errorContent}>
        <svg 
          className={styles.errorIcon} 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 8v4" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" strokeWidth="1" />
        </svg>
        <span className={styles.errorText}>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Dismiss error"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
