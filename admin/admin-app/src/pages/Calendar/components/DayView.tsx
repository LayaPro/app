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

  // Get events for the current day
  const dayEvents: EventWithPosition[] = events
    .filter((event) => {
      if (!event.fromDatetime) return false;
      const eventDateStr = formatDateString(new Date(event.fromDatetime));
      const currentDateStr = formatDateString(currentDate);
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
      const durationMinutes = endMinutes - startMinutes || 60; // Default 1 hour

      const top = (startMinutes / 60) * HOUR_HEIGHT;
      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 32); // Minimum 32px

      return {
        ...event,
        top,
        height,
      };
    });

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
          <div className={styles.dayViewDay}>{dayOfWeek}</div>
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
          {/* Hour slots */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className={styles.weekTimeSlot}
              style={{ borderBottom: '1px solid #e5e7eb', height: `${HOUR_HEIGHT}px` }}
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

            return (
              <div
                key={event.clientEventId}
                className={`${styles.weekEventItem} ${styles[color]}`}
                style={{
                  position: 'absolute',
                  top: `${event.top}px`,
                  height: `${event.height}px`,
                  left: '8px',
                  right: '8px',
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
  );
};
