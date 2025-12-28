import type { ClientEvent } from '../types.ts';
import styles from '../Albums.module.css';

interface EventsViewProps {
  events: ClientEvent[];
  onEventClick: (event: ClientEvent) => void;
  eventTypes: Map<string, any>;
  getEventImageCount: (clientEventId: string) => number;
  getTimeAgo: (date?: string) => string;
  openMenuId: string | null;
  onToggleMenu: (eventId: string, e: React.MouseEvent) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  eventDeliveryStatuses: Map<string, any>;
  onSetEventStatus: (event: ClientEvent) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  onEventClick,
  eventTypes,
  getEventImageCount,
  getTimeAgo,
  openMenuId,
  onToggleMenu,
  menuRef,
  eventDeliveryStatuses,
  onSetEventStatus
}) => {
  if (events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3>No events found</h3>
        <p>This project doesn't have any events yet</p>
      </div>
    );
  }

  return (
    <div className={styles.eventsGrid}>
      {events.map((event: any) => (
        <div
          key={event.clientEventId}
          className={styles.card}
          onClick={() => onEventClick(event)}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.cardImage}>
            <img
              src={event.coverImage || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop'}
              alt={eventTypes.get(event.eventId)?.eventDesc || 'Event'}
            />
          </div>

          <div className={styles.cardContent}>
            <div className={styles.cardMenu} ref={openMenuId === event.clientEventId ? menuRef : null}>
              <button
                className={styles.menuButton}
                onClick={(e) => onToggleMenu(event.clientEventId, e)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
              </button>
            </div>

            <h3 className={styles.cardTitle}>
              {eventTypes.get(event.eventId)?.eventDesc || 'Event'}
              {/* Status badge - Show event delivery status */}
              {event.eventDeliveryStatusId && (() => {
                const status = eventDeliveryStatuses.get(event.eventDeliveryStatusId);
                if (!status) return null;
                
                return (
                  <div className={styles.eventStatusBadge}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>{status.statusDescription}</span>
                  </div>
                );
              })()}
            </h3>
            <div className={styles.cardSubtitle}>
              {event.fromDatetime
                ? new Date(event.fromDatetime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Date not set'}
            </div>

            <div className={styles.cardStats}>
              {(() => {
                const photoCount = getEventImageCount(event.clientEventId);
                return (
                  <div className={styles.statItem}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{photoCount === 0 ? 'No photos' : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`}</span>
                  </div>
                );
              })()}
              <div className={styles.timeAgo}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{getTimeAgo(event.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
