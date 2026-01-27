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
  info?: string;
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
  info,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeError, setTimeError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const dateSelectedRef = useRef(false);

  // Parse time value into components
  const parseTime = (time: string) => {
    if (!time) return { hour: '', minute: '', period: 'AM' };
    const [hourMin] = time.split(':');
    const hour24 = parseInt(hourMin);
    const minute = parseInt(time.split(':')[1] || '0');
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return { 
      hour: String(hour12), 
      minute: String(Math.floor(minute / 10) * 10), 
      period 
    };
  };

  const [timeComponents, setTimeComponents] = useState({ hour: '', minute: '', period: 'AM' });

  useEffect(() => {
    if (timeValue) {
      setTimeComponents(parseTime(timeValue));
    } else {
      setTimeComponents({ hour: '', minute: '', period: 'AM' });
    }
  }, [timeValue]);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleInfoClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleInfoClickOutside);
      return () => document.removeEventListener('mousedown', handleInfoClickOutside);
    }
  }, [showInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // If time is required but not selected, show error and prevent closing
        if (includeTime && (value || dateSelectedRef.current) && (!timeComponents.hour || !timeComponents.minute)) {
          setTimeError(true);
          return;
        }
        setIsOpen(false);
        setTimeError(false);
        dateSelectedRef.current = false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, includeTime, value, timeComponents]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    if (includeTime && timeValue) {
      // Convert 24-hour format to 12-hour format with AM/PM
      const [hours, minutes] = timeValue.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${dateStr} • ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
    // Create date and format as YYYY-MM-DD in local timezone to avoid timezone offset issues
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    
    if (includeTime) {
      // Mark that date was selected and reset time components to force user selection
      dateSelectedRef.current = true;
      setTimeComponents({ hour: '', minute: '', period: 'AM' });
    } else {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (component: 'hour' | 'minute' | 'period', value: string) => {
    const newComponents = { ...timeComponents, [component]: value };
    setTimeComponents(newComponents);
    
    // Clear error when user starts selecting time
    if (timeError) {
      setTimeError(false);
    }
    
    // Only update parent if both hour and minute are selected
    if (newComponents.hour && newComponents.minute) {
      // Convert to 24-hour format
      let hour24 = parseInt(newComponents.hour);
      if (newComponents.period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (newComponents.period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const timeStr = `${String(hour24).padStart(2, '0')}:${newComponents.minute.padStart(2, '0')}`;
      onTimeChange?.(timeStr);
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
    // Format date as YYYY-MM-DD without timezone conversion
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = value === dateStr;
    
    // Check if today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = todayStr === dateStr;
    
    const isDisabled = !!(minDate && dateStr < minDate);

    days.push(
      <button
        key={day}
        type="button"
        className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''} ${isDisabled ? styles.disabled : ''}`}
        onClick={() => !isDisabled && handleDateSelect(day)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            handleDateSelect(day);
          }
        }}
        disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        aria-label={`Select ${monthName} ${day}`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
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
        </div>
      )}
      
      <div ref={pickerRef}>
        <button
          type="button"
          className={`${styles.dateButton} ${error ? styles.error : ''} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={label ? `${label} date picker` : 'Date picker'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
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
            <button type="button" className={styles.navButton} onClick={handlePrevMonth} aria-label="Previous month">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={styles.monthLabel}>{monthName}</span>
            <button type="button" className={styles.navButton} onClick={handleNextMonth} aria-label="Next month">
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
            <div className={`${styles.timeSection} ${timeError ? styles.timeError : ''}`}>
              <div className={styles.timeSeparator}></div>
              {timeError && (
                <div className={styles.timeErrorMessage}>
                  Please select a time
                </div>
              )}
              <div className={styles.timeInputWrapper}>
                <svg className={styles.timeIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className={styles.timeSelectors}>
                  <select
                    className={`${styles.timeSelect} ${timeError ? styles.timeSelectError : ''}`}
                    value={timeComponents.hour}
                    onChange={(e) => handleTimeChange('hour', e.target.value)}
                  >
                    <option value="">--</option>
                    {[...Array(12)].map((_, i) => {
                      const hour = i + 1;
                      return <option key={hour} value={hour}>{hour}</option>;
                    })}
                  </select>
                  <span className={styles.timeSeparatorText}>:</span>
                  <select
                    className={`${styles.timeSelect} ${timeError ? styles.timeSelectError : ''}`}
                    value={timeComponents.minute}
                    onChange={(e) => handleTimeChange('minute', e.target.value)}
                  >
                    <option value="">--</option>
                    <option value="0">00</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="50">50</option>
                  </select>
                  <select
                    className={styles.timeSelect}
                    value={timeComponents.period}
                    onChange={(e) => handleTimeChange('period', e.target.value)}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
