import { useState, useRef, useEffect } from 'react';
import type { ClientEvent } from '@/types/shared';
import {
  formatDateString,
  DAY_NAMES,
  MONTH_NAMES,
  getEventColor,
} from '../../../utils/calendar';
import { DatePicker } from '../../../components/ui/DatePicker';
import styles from '../Calendar.module.css';

interface DayViewProps {
  currentDate: Date;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;  onPrevDay?: () => void;
  onNextDay?: () => void;
  onDateChange?: (date: Date) => void;}

interface EventWithPosition extends ClientEvent {
  top: number;
  height: number;
  column: number;
  totalColumns: number;
  startMinutes: number;
  endMinutes: number;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  eventTypes,
  projects,
  onEventClick,
  onPrevDay,
  onNextDay,
  onDateChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState('');
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const prevDateRef = useRef<Date>(currentDate);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const HOUR_HEIGHT = 64; // pixels per hour
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Handle click outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        setDatePickerValue('');
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  // Track animation direction based on currentDate changes
  useEffect(() => {
    const prevDate = prevDateRef.current;
    if (prevDate.getTime() !== currentDate.getTime()) {
      // Determine animation direction
      if (currentDate > prevDate) {
        setAnimationDirection('right'); // Next day - slide from right
      } else {
        setAnimationDirection('left'); // Prev day - slide from left
      }
      
      prevDateRef.current = currentDate;
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimationDirection(null);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [currentDate]);

  // Get events for the current day with overlap detection
  const getEventsWithPosition = (): EventWithPosition[] => {
    const currentDateStr = formatDateString(currentDate);

    const dayEvents = events
      .filter((event) => {
        if (!event.fromDatetime) return false;
        const eventDateStr = formatDateString(new Date(event.fromDatetime));
        return eventDateStr === currentDateStr;
      })
      .map((event) => {
        const fromDate = new Date(event.fromDatetime!);
        const toDate = event.toDatetime ? new Date(event.toDatetime) : new Date(fromDate.getTime() + 60 * 60 * 1000);

        // Calculate position
        const startHour = fromDate.getHours();
        const startMinute = fromDate.getMinutes();
        const endHour = toDate.getHours();
        const endMinute = toDate.getMinutes();

        const startMinutes = startHour * 60 + startMinute;
        let endMinutes = endHour * 60 + endMinute;
        
        // Check if event spans to next day
        const fromDateStr = formatDateString(fromDate);
        const toDateStr = formatDateString(toDate);
        
        // If event ends on a different day, cap it at end of current day (11:59 PM = 1439 minutes)
        if (fromDateStr !== toDateStr || endMinutes <= startMinutes) {
          endMinutes = 1440; // 24 hours * 60 minutes
        }
        
        const durationMinutes = endMinutes - startMinutes || 60; // Default 1 hour if same time

        const top = (startMinutes / 60) * HOUR_HEIGHT;
        const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 32); // Minimum 32px

        return {
          ...event,
          top,
          height,
          startMinutes,
          endMinutes,
          column: 0,
          totalColumns: 1,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Calculate overlapping events and assign columns
    const eventsWithColumns: EventWithPosition[] = [];
    
    for (let i = 0; i < dayEvents.length; i++) {
      const currentEvent = dayEvents[i];
      let column = 0;
      let maxColumns = 1;

      // Find overlapping events that came before this one
      const overlappingEvents = eventsWithColumns.filter(
        (e) => e.startMinutes < currentEvent.endMinutes && e.endMinutes > currentEvent.startMinutes
      );

      if (overlappingEvents.length > 0) {
        // Find the first available column
        const usedColumns = overlappingEvents.map((e) => e.column);
        while (usedColumns.includes(column)) {
          column++;
        }
        
        // Calculate total columns needed
        maxColumns = Math.max(...overlappingEvents.map((e) => e.totalColumns), column + 1);
        
        // Update totalColumns for all overlapping events
        overlappingEvents.forEach((e) => {
          e.totalColumns = maxColumns;
        });
      }

      eventsWithColumns.push({
        ...currentEvent,
        column,
        totalColumns: maxColumns,
      });
    }

    return eventsWithColumns;
  };

  const dayEvents = getEventsWithPosition();
  const maxColumns = Math.max(...dayEvents.map(e => e.totalColumns), 1);
  const needsScroll = maxColumns > 1;

  // Format hour label
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const dayOfWeek = DAY_NAMES[currentDate.getDay()];

  return (
    <div className={styles.dayView}>
      {/* Day Navigation Header */}
      {(onPrevDay || onNextDay || onDateChange) && (
        <div className={styles.desktopMonthHeader}>
          {onPrevDay && (
            <button 
              className={styles.desktopNavButton}
              onClick={onPrevDay}
              aria-label="Previous day"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div style={{ position: 'relative', flex: 1 }}>
            <h2 
              className={styles.desktopMonthTitle}
              onClick={() => onDateChange && setShowDatePicker(!showDatePicker)}
              style={{ cursor: onDateChange ? 'pointer' : 'default' }}
            >
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
            </h2>
            {showDatePicker && onDateChange && (
              <div ref={datePickerRef} style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                zIndex: 1000,
                minWidth: '300px',
              }}>
                <DatePicker
                  value={datePickerValue}
                  onChange={(value) => {
                    if (value) {
                      onDateChange(new Date(value));
                      setShowDatePicker(false);
                      setDatePickerValue('');
                    }
                  }}
                  placeholder="Select date to navigate"
                  allowPast={true}
                />
              </div>
            )}
          </div>
          {onNextDay && (
            <button 
              className={styles.desktopNavButton}
              onClick={onNextDay}
              aria-label="Next day"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Header with date */}
      <div className={styles.dayHeader}>
        <div className={styles.weekTimeLabel}>TIME</div>
        <div className={`${styles.dayViewDateHeader} ${animationDirection === 'left' ? styles.slideFromLeft : animationDirection === 'right' ? styles.slideFromRight : ''}`}>
          <div className={styles.dayViewDate}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
          </div>
          <div className={styles.dayViewDay}>
            {dayOfWeek}
            {dayEvents.length > 0 && (
              <span className={styles.eventCount}> ({dayEvents.length})</span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline and events */}
      <div className={styles.dayContent}>
        {/* Timeline */}
        <div className={styles.weekTimeline}>
          {HOURS.map((hour) => (
            <div key={hour} className={styles.weekTimeSlot}>
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className={`${styles.dayGrid} ${animationDirection === 'left' ? styles.slideFromLeft : animationDirection === 'right' ? styles.slideFromRight : ''}`}>
          <div style={{ 
            minWidth: needsScroll ? `${maxColumns * 200}px` : '100%',
            position: 'relative'
          }}>
            {/* Hour slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={styles.weekTimeSlot}
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Events */}
            {dayEvents.map((event) => {
              const eventType = eventTypes.get(event.eventId);
              const project = projects.get(event.projectId);
              const fromDate = new Date(event.fromDatetime!);
              const toDate = event.toDatetime ? new Date(event.toDatetime) : null;
              const color = getEventColor(fromDate, toDate);
              
              const formatTime = (d: Date) => d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              
              // Check if event spans to next day
              const fromDateStr = formatDateString(fromDate);
              const toDateStr = toDate ? formatDateString(toDate) : fromDateStr;
              const spansToNextDay = fromDateStr !== toDateStr;
              
              const timeLabel = toDate 
                ? `${formatTime(fromDate)} - ${formatTime(toDate)}${spansToNextDay ? ' (Next Day)' : ''}` 
                : formatTime(fromDate);
              
              const displayText = project ? `${eventType?.eventDesc || 'Event'} - ${project.projectName}` : eventType?.eventDesc || 'Event';

              const leftPosition = needsScroll ? `${event.column * 200}px` : `${(event.column / event.totalColumns) * 100}%`;
              const widthStyle = needsScroll ? '198px' : `calc(${100 / event.totalColumns}% - 8px)`;

              return (
                <div
                  key={event.clientEventId}
                  className={`${styles.weekEventItem} ${styles[color]}`}
                  style={{
                    position: 'absolute',
                    top: `${event.top}px`,
                    height: `${event.height}px`,
                    left: leftPosition,
                    width: widthStyle,
                    zIndex: 10,
                  }}
                  onClick={() => onEventClick(event)}
                  title={`${timeLabel} - ${displayText}`}
                >
                  <div className={styles.eventTime}>
                    {timeLabel}
                  </div>
                  <div className={styles.eventTitle}>
                    {displayText}
                  </div>
                  {event.venue && (
                    <div className={styles.eventVenue}>
                      <svg className={styles.venueIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.venue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
