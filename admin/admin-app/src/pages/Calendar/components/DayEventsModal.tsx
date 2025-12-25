import type { ClientEvent } from 'laya-shared';
import { Modal } from '../../../components/ui';
import { formatTimeString, getEventColor } from '../../../utils/calendar';
import styles from './DayEventsModal.module.css';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  onEventClick: (event: ClientEvent) => void;
}

export const DayEventsModal: React.FC<DayEventsModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  eventTypes,
  projects,
  onEventClick,
}) => {
  if (!date) return null;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formattedDate}
      size="medium"
    >
      <div className={styles.eventsListContainer}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>No events scheduled for this day</div>
        ) : (
          <div className={styles.eventsList}>
            {events.map((event) => {
              const color = getEventColor(new Date(event.fromDatetime!));
              const eventType = eventTypes.get(event.eventId);
              const project = projects.get(event.projectId);
              const fromTime = event.fromDatetime
                ? formatTimeString(new Date(event.fromDatetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
                : '';
              const toTime = event.toDatetime
                ? formatTimeString(new Date(event.toDatetime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
                : '';
              const displayText = project
                ? `${eventType?.eventDesc || 'Event'} - ${project.projectName}`
                : eventType?.eventDesc || 'Event';

              return (
                <div
                  key={event.clientEventId}
                  className={`${styles.eventCard} ${styles[color]}`}
                  onClick={() => {
                    onEventClick(event);
                    onClose();
                  }}
                >
                  <div className={styles.eventTime}>
                    {fromTime}
                    {toTime && ` - ${toTime}`}
                  </div>
                  <div className={styles.eventTitle}>{displayText}</div>
                  {event.venue && (
                    <div className={styles.eventVenue}>
                      📍 {event.venue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
