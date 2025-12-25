import type { ClientEvent } from 'laya-shared';
import {
  formatDateString,
  DAY_NAMES,
  MONTH_NAMES,
  getEventColor,
} from '../../../utils/calendar';
import styles from '../Calendar.module.css';

interface DayViewProps {
  currentDate: Date;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;
}

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
}) => {
  const HOUR_HEIGHT = 64; // pixels per hour
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
        const endMinutes = endHour * 60 + endMinute;
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
      {/* Header with date */}
      <div className={styles.dayHeader}>
        <div className={styles.weekTimeLabel}>TIME</div>
        <div className={styles.dayViewDateHeader}>
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
        <div className={styles.dayGrid}>
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
              const color = getEventColor(new Date(event.fromDatetime!));
              const fromDate = new Date(event.fromDatetime!);
              const toDate = event.toDatetime ? new Date(event.toDatetime) : null;
              
              const formatTime = (d: Date) => d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              
              const timeLabel = toDate ? `${formatTime(fromDate)} - ${formatTime(toDate)}` : formatTime(fromDate);
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
