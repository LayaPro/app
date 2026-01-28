import { useState, useEffect, useRef } from 'react';
import type { ClientEvent } from '@/types/shared';
import {
  DAY_NAMES,
  getFirstDayOfMonth,
  getDaysInMonth,
  formatDateString,
  isToday,
  formatTimeString,
  getEventColor,
} from '../../../utils/calendar';
import { DatePicker } from '../../../components/ui/DatePicker';
import styles from '../Calendar.module.css';

interface MobileMonthViewProps {
  currentDate: Date;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;
  onEventEdit?: (event: ClientEvent) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthChange?: (date: Date) => void;
}

interface DayEvents {
  [dateStr: string]: ClientEvent[];
}

export const MobileMonthView: React.FC<MobileMonthViewProps> = ({
  currentDate,
  events,
  eventTypes,
  projects,
  onEventClick,
  onEventEdit,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
}) => {
  // Initialize with today's date if it's in the current month
  const today = new Date();
  const isTodayInCurrentMonth = today.getFullYear() === currentDate.getFullYear() && 
                                 today.getMonth() === currentDate.getMonth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(isTodayInCurrentMonth ? today : null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const prevDateRef = useRef<Date>(currentDate);

  // Reset to today when month changes
  useEffect(() => {
    const newToday = new Date();
    const isTodayInNewMonth = newToday.getFullYear() === currentDate.getFullYear() && 
                               newToday.getMonth() === currentDate.getMonth();
    setSelectedDate(isTodayInNewMonth ? newToday : null);
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Auto-click the date picker input when it becomes visible
  useEffect(() => {
    if (showDatePicker && datePickerRef.current) {
      const input = datePickerRef.current.querySelector('input[type="text"]');
      if (input) {
        setTimeout(() => {
          (input as HTMLInputElement).focus();
          (input as HTMLInputElement).click();
        }, 100);
      }
    }
  }, [showDatePicker]);

  useEffect(() => {
    const prevDate = prevDateRef.current;
    if (prevDate.getTime() !== currentDate.getTime()) {
      // Determine animation direction
      if (currentDate > prevDate) {
        setAnimationDirection('left'); // Next month - slide from right
      } else {
        setAnimationDirection('right'); // Prev month - slide from left
      }
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimationDirection(null);
      }, 400);
      
      prevDateRef.current = currentDate;
      
      return () => clearTimeout(timer);
    }
  }, [currentDate]);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Group events by date and sort by start time
  const eventsByDate: DayEvents = {};
  events.forEach((event) => {
    if (event.fromDatetime) {
      const date = new Date(event.fromDatetime);
      const dateStr = formatDateString(date);
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      eventsByDate[dateStr].push(event);
    }
  });

  // Sort events within each day by start datetime
  Object.keys(eventsByDate).forEach((dateStr) => {
    eventsByDate[dateStr].sort((a, b) => {
      const timeA = a.fromDatetime ? new Date(a.fromDatetime).getTime() : 0;
      const timeB = b.fromDatetime ? new Date(b.fromDatetime).getTime() : 0;
      return timeA - timeB;
    });
  });

  const handleDayClick = (cellDate: Date) => {
    setSelectedDate(cellDate);
  };

  // Build calendar cells
  const cells: React.ReactElement[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push(
      <div key={`prev-${day}`} className={`${styles.mobileMonthCell} ${styles.otherMonth}`}>
        <span className={styles.mobileDayNumber}>{day}</span>
      </div>
    );
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateStr = formatDateString(cellDate);
    const dayEvents = eventsByDate[dateStr] || [];
    const isTodayCell = isToday(cellDate);
    const isSelected = selectedDate && formatDateString(selectedDate) === dateStr;

    cells.push(
      <div
        key={`current-${day}`}
        className={`${styles.mobileMonthCell} ${isSelected ? styles.selected : (isTodayCell ? styles.today : '')}`}
        onClick={() => handleDayClick(cellDate)}
      >
        <span className={styles.mobileDayNumber}>{day}</span>
        {dayEvents.length > 0 && (
          <div className={styles.eventDots}>
            {dayEvents.slice(0, 3).map((event, idx) => (
              <span key={event.clientEventId || idx} className={styles.eventDot} />
            ))}
            {dayEvents.length > 3 && <span className={styles.moreIndicator}>+</span>}
          </div>
        )}
      </div>
    );
  }

  // Next month days to fill the grid
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    cells.push(
      <div key={`next-${i}`} className={`${styles.mobileMonthCell} ${styles.otherMonth}`}>
        <span className={styles.mobileDayNumber}>{i}</span>
      </div>
    );
  }

  const selectedDateStr = selectedDate ? formatDateString(selectedDate) : null;
  const selectedDayEvents = selectedDateStr ? eventsByDate[selectedDateStr] || [] : [];

  return (
    <div className={styles.mobileMonthView}>
      {/* Month Navigation Header */}
      <div className={styles.mobileMonthHeader}>
        <button 
          className={styles.mobileNavButton}
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ position: 'relative', flex: 1 }}>
          <h2 
            className={styles.mobileMonthTitle}
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{ cursor: 'pointer' }}
          >
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          {showDatePicker && onMonthChange && (
            <div 
              ref={datePickerRef}
              style={{ 
                position: 'absolute', 
                top: '100%', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 1000,
                marginTop: '8px',
                minWidth: '200px'
              }}
            >
              <DatePicker
                value={formatDateString(currentDate)}
                onChange={(dateStr) => {
                  if (dateStr) {
                    onMonthChange(new Date(dateStr));
                    setShowDatePicker(false);
                  }
                }}
                placeholder="Select date"
              />
            </div>
          )}
        </div>
        <button 
          className={styles.mobileNavButton}
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.mobileMonthGrid}>
        {/* Day headers - Fixed */}
        <div className={styles.mobileDayHeaderRow}>
          {DAY_NAMES.map((dayName) => (
            <div key={dayName} className={styles.mobileDayHeader}>
              {dayName.substring(0, 3)}
            </div>
          ))}
        </div>
        {/* Calendar cells with animation */}
        <div 
          className={`${styles.mobileCalendarCells} ${
            animationDirection === 'left' ? styles.slideFromRight : 
            animationDirection === 'right' ? styles.slideFromLeft : ''
          }`}
        >
          {cells}
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDate && (
        <div 
          key={selectedDate.toISOString()}
          className={styles.mobileEventsList}
        >
          <div className={styles.mobileEventsHeader}>
            <h3>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button 
              className={styles.closeButton}
              onClick={() => setSelectedDate(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.mobileEventsContent}>
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => {
              const eventType = eventTypes.get(event.eventId);
              const project = projects.get(event.projectId);
              const fromTime = event.fromDatetime 
                ? formatTimeString(new Date(event.fromDatetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })) 
                : '';
              const toTime = event.toDatetime 
                ? formatTimeString(new Date(event.toDatetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })) 
                : '';
              const eventColor = event.fromDatetime ? getEventColor(new Date(event.fromDatetime)) : 'blue';
              
              return (
                <div
                  key={event.clientEventId}
                  className={`${styles.mobileEventCard} ${styles[eventColor]}`}
                >
                  <div className={styles.mobileEventCardContent} onClick={() => onEventClick(event)}>
                    <div className={styles.mobileEventTime}>
                      {fromTime}{toTime && ` - ${toTime}`}
                    </div>
                    <div className={styles.mobileEventTitle}>
                      {eventType?.eventDesc || 'Event'}
                    </div>
                    <div className={styles.mobileEventProject}>
                      {project?.projectName || ''}
                    </div>
                    {event.venue && (
                      <div className={styles.mobileEventVenue}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venue}
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.mobileEventEditButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventEdit?.(event);
                    }}
                    title="Edit event"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              );
            })
            ) : (
              <div className={styles.noEventsMessage}>
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
