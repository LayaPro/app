import { useState, useMemo } from 'react';
import type { ClientEvent } from 'laya-shared';
import { getInitials, getAvatarColorClass } from '../../../utils/calendar';
import styles from '../Calendar.module.css';

interface ListViewProps {
  events: ClientEvent[];
  eventTypes: Map<string, { eventDesc: string; eventAlias?: string }>;
  projects: Map<string, { projectName: string }>;
  teamMembers: Map<string, { firstName: string; lastName: string }>;
  eventDeliveryStatuses: Map<string, { statusCode: string; statusDescription: string }>;
  onEventClick: (event: ClientEvent) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  eventTypes,
  projects,
  teamMembers,
  eventDeliveryStatuses,
  onEventClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeople] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((event) => {
        const eventType = eventTypes.get(event.eventId);
        const eventTypeName = (eventType?.eventDesc || '').toLowerCase();
        const venue = (event.venue || '').toLowerCase();
        const city = (event.city || '').toLowerCase();
        const notes = (event.notes || '').toLowerCase();
        
        return (
          eventTypeName.includes(searchLower) ||
          venue.includes(searchLower) ||
          city.includes(searchLower) ||
          notes.includes(searchLower)
        );
      });
    }

    // People filter
    if (selectedPeople.length > 0) {
      filtered = filtered.filter((event) =>
        event.teamMembersAssigned?.some((memberId) => selectedPeople.includes(memberId))
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(
        (event) => event.fromDatetime && new Date(event.fromDatetime) >= fromDate
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (event) => event.fromDatetime && new Date(event.fromDatetime) <= toDate
      );
    }

    // Event type filter
    if (selectedEventType) {
      filtered = filtered.filter((event) => event.eventId === selectedEventType);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((event) => event.eventDeliveryStatusId === selectedStatus);
    }

    // Sort by date (ascending)
    filtered.sort((a, b) => {
      const dateA = a.fromDatetime ? new Date(a.fromDatetime).getTime() : 0;
      const dateB = b.fromDatetime ? new Date(b.fromDatetime).getTime() : 0;
      return dateA - dateB;
    });

    return filtered;
  }, [events, searchTerm, selectedPeople, dateFrom, dateTo, selectedEventType, selectedStatus, eventTypes]);

  // Get unique event types for dropdown
  const eventTypeOptions = useMemo(() => {
    const types = new Set<string>();
    events.forEach((event) => types.add(event.eventId));
    return Array.from(types).map((eventId) => ({
      value: eventId,
      label: eventTypes.get(eventId)?.eventDesc || 'Unknown',
    }));
  }, [events, eventTypes]);

  // Get unique statuses for dropdown
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    events.forEach((event) => {
      if (event.eventDeliveryStatusId) statuses.add(event.eventDeliveryStatusId);
    });
    return Array.from(statuses).map((statusId) => ({
      value: statusId,
      label: eventDeliveryStatuses.get(statusId)?.statusDescription || 'Unknown',
    }));
  }, [events, eventDeliveryStatuses]);

  const formatEventDate = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatEventTime = (fromDate?: Date, toDate?: Date) => {
    if (!fromDate) return '';
    const from = new Date(fromDate);
    const to = toDate ? new Date(toDate) : null;
    
    const formatTime = (d: Date) => {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    };

    return to ? `${formatTime(from)} - ${formatTime(to)}` : formatTime(from);
  };

  const getEventTypeColor = (eventId: string): string => {
    // Generate consistent colors for event types
    const colors = [
      'bg-violet-500',
      'bg-blue-500',
      'bg-emerald-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={styles.listView}>
      {/* Filters */}
      <div className={styles.listFilters}>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Search</label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Search events, venues, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Event Type</label>
            <select
              className={styles.filterInput}
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
            >
              <option value="">All Types</option>
              {eventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>From Date</label>
            <input
              type="date"
              className={styles.filterInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>To Date</label>
            <input
              type="date"
              className={styles.filterInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.filterInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className={styles.listItems}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            No events found matching your filters
          </div>
        ) : (
          filteredEvents.map((event) => {
            const eventType = eventTypes.get(event.eventId);
            const project = projects.get(event.projectId);
            const eventColor = getEventTypeColor(event.eventId);
            const assignedMembers = event.teamMembersAssigned?.map((memberId) => {
              const member = teamMembers.get(memberId);
              return member ? { ...member, id: memberId } : null;
            }).filter(Boolean) || [];

            return (
              <div key={event.clientEventId} className={styles.listItem} onClick={() => onEventClick(event)}>
                <div className={styles.listItemHeader}>
                  <div className={styles.listItemInfo}>
                    <div className={styles.listItemBadges}>
                      <span className={`${styles.typeBadge} ${eventColor}`}>
                        {eventType?.eventDesc || 'Unknown Event'}
                      </span>
                      <span className={styles.dateBadge}>
                        {formatEventDate(event.fromDatetime)}
                      </span>
                    </div>
                    <h3 className={styles.listItemTitle}>
                      {eventType?.eventDesc || 'Event'} - {project?.projectName || 'Unknown Project'} {event.venue ? `(${event.venue})` : ''}
                    </h3>
                    <div className={styles.listItemDetails}>
                      <div className={styles.listItemDetail}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatEventTime(event.fromDatetime, event.toDatetime)}
                      </div>
                      {event.city && (
                        <div className={styles.listItemDetail}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.city}
                        </div>
                      )}
                    </div>
                  </div>
                  {assignedMembers.length > 0 && (
                    <div className={styles.listItemCrew}>
                      {assignedMembers.slice(0, 3).map((member: any) => {
                        const initials = getInitials(member.firstName, member.lastName);
                        const colorClass = getAvatarColorClass(member.id);
                        return (
                          <div
                            key={member.id}
                            className={styles.crewAvatar}
                            style={{
                              background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                              '--tw-gradient-from': colorClass.includes('orange') ? '#fb923c' : 
                                colorClass.includes('indigo') ? '#818cf8' :
                                colorClass.includes('teal') ? '#2dd4bf' :
                                colorClass.includes('pink') ? '#f472b6' :
                                colorClass.includes('amber') ? '#fbbf24' :
                                colorClass.includes('green') ? '#34d399' :
                                colorClass.includes('blue') ? '#60a5fa' : '#a78bfa',
                              '--tw-gradient-to': colorClass.includes('red') ? '#ef4444' :
                                colorClass.includes('purple') ? '#a855f7' :
                                colorClass.includes('cyan') ? '#06b6d4' :
                                colorClass.includes('rose') ? '#f43f5e' :
                                colorClass.includes('yellow') ? '#eab308' :
                                colorClass.includes('emerald') ? '#10b981' :
                                colorClass.includes('indigo') ? '#6366f1' : '#8b5cf6',
                            } as React.CSSProperties}
                            title={`${member.firstName} ${member.lastName}`}
                          >
                            {initials}
                          </div>
                        );
                      })}
                      {assignedMembers.length > 3 && (
                        <div className={styles.crewMore}>+{assignedMembers.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
