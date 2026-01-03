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
  info?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value = [],
  onChange,
  options,
  placeholder = 'Select...',
  error,
  required,
  info,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showInfo, setShowInfo] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

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
      const isClickInsideButton = buttonRef.current?.contains(target);
      const isClickInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isClickInsideButton && !isClickInsideDropdown) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleInfoClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInfo = infoRef.current?.contains(target);
      
      if (!isClickInsideInfo && showInfo) {
        setShowInfo(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }

    if (showInfo) {
      document.addEventListener('mousedown', handleInfoClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleInfoClickOutside);
      };
    }
  }, [isOpen, showInfo]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
          if (focusedIndex === 0) {
            searchInputRef.current?.focus();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleToggle(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, focusedIndex, filteredOptions]);

  // Reset focused index when search term changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const focusedElement = dropdownRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      ) as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

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
                      <span
                        className={styles.chipRemove}
                        onClick={(e) => handleRemove(option.value, e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRemove(option.value, e as any);
                          }
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </span>
                  ))}
                </div>
                {selectedOptions.length > 0 && (
                  <span
                    className={styles.clearAll}
                    onClick={handleClearAll}
                    title="Clear all"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClearAll(e as any);
                      }
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
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
                ref={searchInputRef}
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
                filteredOptions.map((option, index) => {
                  const isSelected = value.includes(option.value);
                  const isFocused = index === focusedIndex;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-index={index}
                      className={`${styles.option} ${isSelected ? styles.selected : ''} ${isFocused ? styles.focused : ''}`}
                      onClick={(e) => handleOptionClick(option.value, e)}
                      onMouseEnter={() => setFocusedIndex(index)}
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
