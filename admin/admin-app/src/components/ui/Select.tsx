import { useState, useRef, useEffect } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  info?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  info,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || '';

  // Close info tooltip on outside click
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideButton = buttonRef.current?.contains(target);
      const isClickInsideDropdown = dropdownRef.current?.contains(target);

      if (!isClickInsideButton && !isClickInsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    const option = options.find(opt => opt.value === optionValue);
    if (!option?.disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {label && (
        <div className={styles.labelRow}>
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
                tabIndex={-1}
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
        </div>
      )}

      <div className={styles.selectWrapper}>
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.selectButton} ${isOpen ? styles.open : ''} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        >
          <span className={displayValue ? styles.selectedText : styles.placeholder}>
            {displayValue || placeholder}
          </span>
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.optionsList}>
              {options.length === 0 ? (
                <div className={styles.noOptions}>No options available</div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.option} ${option.value === value ? styles.selected : ''} ${option.disabled ? styles.optionDisabled : ''}`}
                    onClick={() => handleSelect(option.value)}
                    disabled={option.disabled}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.value === value && (
                      <svg
                        className={styles.checkIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
