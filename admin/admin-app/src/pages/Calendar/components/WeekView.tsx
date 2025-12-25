import type { ClientEvent } from 'laya-shared';
import {
  DAY_NAMES,
  addDays,
  formatDateString,
  isToday,
} from '../../../utils/calendar';
import styles from '../Calendar.module.css';

interface WeekViewProps {
  weekStart: Date;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;
}

interface EventWithPosition extends ClientEvent {
  top: number;
  height: number;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekStart,
  events,
  eventTypes,
  projects,
  onEventClick,
}) => {
  const HOUR_HEIGHT = 64; // pixels per hour
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Get events for each day of the week
  const getEventsForDay = (dayIndex: number): EventWithPosition[] => {
    const dayDate = addDays(weekStart, dayIndex);
    const dateStr = formatDateString(dayDate);

    return events
      .filter((event) => {
        if (!event.fromDatetime) return false;
        const eventDateStr = formatDateString(new Date(event.fromDatetime));
        return eventDateStr === dateStr;
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
        };
      });
  };

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

  return (
    <div className={styles.weekView}>
      {/* Header with day names and dates */}
      <div className={styles.weekHeader}>
        <div className={styles.weekTimeLabel}>TIME</div>
        <div className={styles.weekDaysHeader}>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayDate = addDays(weekStart, dayIndex);
            const isTodayCell = isToday(dayDate);
            return (
              <div
                key={dayIndex}
                className={`${styles.weekDayHeader} ${isTodayCell ? styles.today : ''}`}
              >
                <span className={styles.weekDayName}>{DAY_NAMES[dayDate.getDay()]}</span>
                <span className={styles.weekDayNumber}>{dayDate.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline and events */}
      <div className={styles.weekContent}>
        {/* Timeline */}
        <div className={styles.weekTimeline}>
          {HOURS.map((hour) => (
            <div key={hour} className={styles.weekTimeSlot}>
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={styles.weekGrid}>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayEvents = getEventsForDay(dayIndex);
            return (
              <div key={dayIndex} className={styles.weekDayColumn}>
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div key={hour} className={styles.weekTimeSlot} />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const eventType = eventTypes.get(event.eventId);
                  const project = projects.get(event.projectId);
                  const bgColor = getEventBgColor(event.eventId);
                  const fromDate = new Date(event.fromDatetime!);
                  const timeLabel = fromDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const displayText = project ? `${eventType?.eventDesc || 'Event'} - ${project.projectName}` : eventType?.eventDesc || 'Event';

                  return (
                    <div
                      key={event.clientEventId}
                      className={styles.weekEventItem}
                      style={{
                        top: `${event.top}px`,
                        height: `${event.height}px`,
                        background: bgColor,
                      }}
                      onClick={() => onEventClick(event)}
                      title={`${timeLabel} - ${displayText}`}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                        {timeLabel}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                        {displayText}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
