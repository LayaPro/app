import { useState, useRef, useEffect } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  info?: string;
  disabled?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  rows = 3,
  maxLength,
  showCharCount,
  info,
  disabled,
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

  const charCount = value?.length || 0;

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.labelRow}>
          <div className={styles.labelLeft}>
            <label className={styles.label}>
              {label}
              {required && <span className={styles.required}>*</span>}
            </label>
            {info && (
              <div className={styles.infoWrapper} ref={infoRef}>
                <button
                  type="button"
                  className={styles.infoButton}
                  onClick={() => setShowInfo(!showInfo)}
                  aria-label="More information"
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="0"/>
                  </svg>
                </button>
                {showInfo && (
                  <div className={styles.infoTooltip}>
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>
          {showCharCount && maxLength && (
            <span className={`${styles.charCount} ${charCount >= maxLength ? styles.maxReached : ''}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        className={`${styles.textarea} ${error ? styles.error : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
