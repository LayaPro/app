import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MultiSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  value: string[]; // Array of selected values
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value = [],
  onChange,
  options,
  placeholder = 'Select...',
  error,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideContainer = containerRef.current?.contains(target);
      const isClickInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isClickInsideContainer && !isClickInsideDropdown) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleOptionClick = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggle(optionValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.selectWrapper}>
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.selectButton} ${error ? styles.error : ''} ${isOpen ? styles.open : ''}`}
          onClick={() => {
            if (!isOpen) {
              updateDropdownPosition();
            }
            setIsOpen(!isOpen);
          }}
        >
          <div className={styles.selectedContainer}>
            {selectedOptions.length > 0 ? (
              <>
                <div className={styles.selectedChips}>
                  {selectedOptions.map(option => (
                    <span key={option.value} className={styles.chip}>
                      <span>{option.label}</span>
                      <button
                        type="button"
                        className={styles.chipRemove}
                        onClick={(e) => handleRemove(option.value, e)}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                {selectedOptions.length > 0 && (
                  <button
                    type="button"
                    className={styles.clearAll}
                    onClick={handleClearAll}
                    title="Clear all"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>
          <svg 
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            width="20" 
            height="20" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            <div className={styles.searchContainer}>
              <svg className={styles.searchIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.optionsList}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                      onClick={(e) => handleOptionClick(option.value, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className={styles.checkbox}
                      />
                      {option.label}
                      {isSelected && (
                        <svg className={styles.checkIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
