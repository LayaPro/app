import { useState, useRef, useEffect } from 'react';
import type { ClientEvent } from '@/types/shared';
import {
  DAY_NAMES,
  getFirstDayOfMonth,
  getDaysInMonth,
  formatDateString,
  isToday,
  getEventColor,
  formatTimeString,
} from '../../../utils/calendar';
import { DayEventsModal } from './DayEventsModal';
import styles from '../Calendar.module.css';

interface MonthViewProps {
  currentDate: Date;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;
  onDayClick: (date: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onMonthChange?: (date: Date) => void;
}

interface DayEvents {
  [dateStr: string]: ClientEvent[];
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  eventTypes,
  projects,
  onEventClick,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<ClientEvent[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const prevDateRef = useRef<Date>(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Track animation direction based on currentDate changes
  useEffect(() => {
    const prevDate = prevDateRef.current;
    if (prevDate.getTime() !== currentDate.getTime()) {
      // Determine animation direction
      if (currentDate > prevDate) {
        setAnimationDirection('right'); // Next month - slide from right
      } else {
        setAnimationDirection('left'); // Prev month - slide from left
      }
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimationDirection(null);
      }, 400);
      
      prevDateRef.current = currentDate;
      
      return () => clearTimeout(timer);
    }
  }, [currentDate]);

  const handleShowAllEvents = (date: Date, dayEvents: ClientEvent[], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
    setIsModalOpen(true);
  };

  // Group events by date
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

  // Build calendar cells
  const cells: React.ReactElement[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push(
      <div key={`prev-${day}`} className={`${styles.monthCell} ${styles.otherMonth}`}>
        <div className={styles.cellHeader}>
          <span className={styles.dayNumber}>{day}</span>
        </div>
      </div>
    );
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateStr = formatDateString(cellDate);
    const dayEvents = eventsByDate[dateStr] || [];
    const isTodayCell = isToday(cellDate);

    const animationClass = animationDirection === 'left' ? styles.slideFromLeft : 
                           animationDirection === 'right' ? styles.slideFromRight : '';
    
    cells.push(
      <div
        key={`current-${day}`}
        className={`${styles.monthCell} ${isTodayCell ? styles.today : ''} ${animationClass}`}
        onClick={() => onDayClick(cellDate)}
      >
        <div className={styles.cellHeader}>
          <span className={styles.dayNumber}>{day}</span>
          {isTodayCell && <span className={styles.todayIndicator} />}
        </div>
        <div className={styles.eventsContainer}>
          {dayEvents.slice(0, 3).map((event) => {
            const color = getEventColor(new Date(event.fromDatetime!));
            const eventType = eventTypes.get(event.eventId);
            const project = projects.get(event.projectId);
            const fromTime = event.fromDatetime ? formatTimeString(new Date(event.fromDatetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })) : '';
            const displayText = project ? `${eventType?.eventDesc || 'Event'} - ${project.projectName}` : eventType?.eventDesc || 'Event';
            
            return (
              <div
                key={event.clientEventId}
                className={`${styles.eventItem} ${styles[color]}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                title={`${fromTime} - ${displayText}`}
              >
                {fromTime} {displayText}
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div 
              className={`${styles.eventItem} ${styles.moreEventsItem}`}
              onClick={(e) => handleShowAllEvents(cellDate, dayEvents, e)}
            >
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  // Next month days to fill the grid
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    cells.push(
      <div key={`next-${i}`} className={`${styles.monthCell} ${styles.otherMonth}`}>
        <div className={styles.cellHeader}>
          <span className={styles.dayNumber}>{i}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.monthView}>
        {/* Month Navigation Header */}
        {(onPrevMonth || onNextMonth || onMonthChange) && (
          <div className={styles.desktopMonthHeader}>
            {onPrevMonth && (
              <button 
                className={styles.desktopNavButton}
                onClick={onPrevMonth}
                aria-label="Previous month"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div style={{ position: 'relative', flex: 1 }}>
              <h2 
                className={styles.desktopMonthTitle}
                onClick={() => onMonthChange && setShowDatePicker(!showDatePicker)}
                style={{ cursor: onMonthChange ? 'pointer' : 'default' }}
              >
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              {showDatePicker && onMonthChange && (
                <input
                  type="month"
                  value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-');
                      onMonthChange(new Date(parseInt(year), parseInt(month) - 1, 1));
                      setShowDatePicker(false);
                    }
                  }}
                  onBlur={() => setShowDatePicker(false)}
                  autoFocus
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    padding: '8px 12px',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    zIndex: 100
                  }}
                />
              )}
            </div>
            {onNextMonth && (
              <button 
                className={styles.desktopNavButton}
                onClick={onNextMonth}
                aria-label="Next month"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Calendar Grid - Headers and Cells in one grid */}
        <div className={styles.monthGrid}>
          {/* Day headers */}
          {DAY_NAMES.map((dayName) => (
            <div key={dayName} className={styles.dayHeader}>
              {dayName}
            </div>
          ))}
          {/* Calendar cells */}
          {cells}
        </div>
      </div>

      <DayEventsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        events={selectedDayEvents}
        eventTypes={eventTypes}
        projects={projects}
        onEventClick={onEventClick}
      />
    </>
  );
};
