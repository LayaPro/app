import type { ClientEvent } from '@/types/shared';
import styles from '../ProjectWizard.module.css';

interface EventCardProps {
  event: Partial<ClientEvent> & {
    eventName?: string;
    fromDate?: string;
    toDate?: string;
    fromTime?: string;
    toTime?: string;
    venueLocation?: string;
    teamMembers?: string[];
  };
  index: number;
  teamMemberOptions: Array<{ value: string; label: string }>;
  onRemove: (index: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index, teamMemberOptions, onRemove }) => {
  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatEventTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <div className={styles.eventName}>{event.eventName}</div>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(index)}
          title="Remove event"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <div className={styles.eventMeta}>
        <div className={styles.eventMetaItem}>
          <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={styles.metaText}>
            <strong>From:</strong> {formatEventDate(event.fromDate)}{event.fromTime && `, ${formatEventTime(event.fromTime)}`}
          </span>
        </div>

        {(event.toDate || event.toTime) && (
          <div className={styles.eventMetaItem}>
            <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={styles.metaText}>
              <strong>To:</strong> {event.toDate ? formatEventDate(event.toDate) : formatEventDate(event.fromDate)}{event.toTime && `, ${formatEventTime(event.toTime)}`}
            </span>
          </div>
        )}

        <div className={styles.eventMetaItem}>
          <svg className={styles.metaIcon} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={styles.metaText}>{event.venue}</span>
        </div>

        {event.venueLocation && (
          <a 
            href={event.venueLocation} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.mapLink}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Map
          </a>
        )}
      </div>

      {event.teamMembers && event.teamMembers.length > 0 && (
        <div className={styles.eventTeamMembers}>
          <span className={styles.teamMembersLabel}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Team:
          </span>
          {event.teamMembers.map((memberId: string) => {
            const member = teamMemberOptions.find(m => m.value === memberId);
            return member ? (
              <span key={memberId} className={styles.teamMemberChip}>
                {member.label}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
