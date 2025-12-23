import { useState, useRef, useEffect } from 'react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  minDate?: string;
  includeTime?: boolean;
  timeValue?: string;
  onTimeChange?: (value: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  required,
  minDate,
  includeTime = false,
  timeValue = '',
  onTimeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only close on outside click if time selection is not required
        if (!includeTime) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [includeTime]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    if (includeTime && timeValue) {
      return `${dateStr} • ${timeValue}`;
    }
    return dateStr;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const isoString = date.toISOString().split('T')[0];
    onChange(isoString);
    
    // Only close if time is not required - otherwise require Set button click
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isoString = date.toISOString().split('T')[0];
    const isSelected = value === isoString;
    const isToday = new Date().toISOString().split('T')[0] === isoString;
    const isDisabled = !!(minDate && isoString < minDate);

    days.push(
      <button
        key={day}
        type="button"
        className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''} ${isDisabled ? styles.disabled : ''}`}
        onClick={() => !isDisabled && handleDateSelect(day)}
        disabled={isDisabled}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <button
        type="button"
        className={`${styles.dateButton} ${error ? styles.error : ''} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className={styles.calendarIcon} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={selectedDate ? styles.selectedText : styles.placeholder}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={styles.monthLabel}>{monthName}</span>
            <button type="button" className={styles.navButton} onClick={handleNextMonth}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className={styles.weekdays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className={styles.weekday}>{day}</div>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {days}
          </div>

          {includeTime && (
            <div className={styles.timeSection}>
              <div className={styles.timeSeparator}></div>
              <div className={styles.timeInputWrapper}>
                <svg className={styles.timeIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={timeValue}
                  onChange={(e) => onTimeChange?.(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.setButton}
                  onClick={() => setIsOpen(false)}
                  disabled={!timeValue}
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
