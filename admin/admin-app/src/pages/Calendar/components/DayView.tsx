import type { ClientEvent } from 'laya-shared';
import { formatDateString, DAY_NAMES, MONTH_NAMES } from '../../../utils/calendar';
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

  // Get background color for event
  const getEventBgColor = (eventId: string): string => {
    const colors = [
      '#8b5cf6', // violet
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f97316', // orange
      '#ec4899', // pink
      '#14b8a6', // teal
    ];
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
            const bgColor = getEventBgColor(event.eventId);
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
                className={styles.weekEventItem}
                style={{
                  position: 'absolute',
                  top: `${event.top}px`,
                  height: `${event.height}px`,
                  background: bgColor,
                  left: '8px',
                  right: '8px',
                }}
                onClick={() => onEventClick(event)}
                title={`${timeLabel} - ${displayText}`}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {timeLabel}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.95, marginBottom: '2px' }}>
                  {displayText}
                </div>
                {event.venue && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                    📍 {event.venue}
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
