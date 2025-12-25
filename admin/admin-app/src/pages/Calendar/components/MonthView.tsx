import { useState } from 'react';
import type { ClientEvent } from 'laya-shared';
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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<ClientEvent[]>([]);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

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

    cells.push(
      <div
        key={`current-${day}`}
        className={`${styles.monthCell} ${isTodayCell ? styles.today : ''}`}
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
              className={styles.eventItem} 
              style={{ background: '#f3f4f6', borderColor: '#9ca3af', cursor: 'pointer' }}
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
        {/* Day headers */}
        <div className={styles.monthGrid}>
          {DAY_NAMES.map((dayName) => (
            <div key={dayName} className={styles.dayHeader}>
              {dayName}
            </div>
          ))}
        </div>
        {/* Calendar cells */}
        <div className={styles.monthGrid}>{cells}</div>
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
