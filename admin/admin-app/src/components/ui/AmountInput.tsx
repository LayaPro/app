import { useState, useRef, useEffect } from 'react';
import styles from './AmountInput.module.css';

interface AmountInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  info?: string;
  disabled?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Enter amount',
  error,
  required,
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  const formatIndianNumber = (num: string) => {
    // Remove non-digits
    const digits = num.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Convert to number and back to remove leading zeros
    const number = parseInt(digits, 10);
    if (isNaN(number)) return '';
    
    // Format in Indian style: last 3 digits, then groups of 2
    const numStr = number.toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    
    if (otherNumbers !== '') {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    
    return lastThree;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove all non-digits
    const digitsOnly = input.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  return (
    <div className={styles.container}>
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
      
      <div className={styles.inputWrapper}>
        <span className={styles.currencySymbol}>₹</span>
        <input
          type="text"
          inputMode="numeric"
          className={`${styles.input} ${error ? styles.error : ''}`}
          value={formatIndianNumber(value)}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
