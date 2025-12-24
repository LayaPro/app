import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { DatePicker } from '../../../components/ui/DatePicker';
import { EventCard } from './EventCard';
import type { ProjectFormData } from '../ProjectWizard';
import styles from '../ProjectWizard.module.css';

interface EventsStepProps {
  formData: ProjectFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  events: any[];
  teamMembers: any[];
}

export const EventsStep: React.FC<EventsStepProps> = ({ formData, onChange, errors, events, teamMembers }) => {
  const [newEvent, setNewEvent] = useState({
    eventType: '',
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: '',
    venue: '',
    venueLocation: '',
    teamMembers: [] as string[],
  });

  // Transform team members from API into MultiSelect options
  const teamMemberOptions = Array.isArray(teamMembers) ? teamMembers.map((member: any) => ({
    value: member.memberId || member._id,
    label: `${member.firstName} ${member.lastName}${member.profile?.name ? ` - ${member.profile.name}` : ''}`,
  })) : [];

  // Transform events from API into SearchableSelect options
  const eventTypeOptions = [
    { value: '', label: 'Select Event Type' },
    ...(Array.isArray(events) ? events.map((event: any) => ({
      value: event.eventId || event._id,
      label: event.eventDesc || event.eventCode,
    })) : [])
  ];

  const handleAddEvent = () => {
    if (!newEvent.eventType || !newEvent.fromDate || !newEvent.venue) {
      return;
    }

    const event = {
      eventId: newEvent.eventType, // Use the selected event ID from dropdown
      eventName: eventTypeOptions.find(opt => opt.value === newEvent.eventType)?.label || '',
      fromDate: newEvent.fromDate,
      toDate: newEvent.toDate || newEvent.fromDate,
      fromTime: newEvent.fromTime,
      toTime: newEvent.toTime,
      venue: newEvent.venue,
      venueLocation: newEvent.venueLocation,
      teamMembers: newEvent.teamMembers,
    };

    const updatedEvents = [...formData.events, event].sort((a, b) => {
      const dateA = a.fromDate || '';
      const dateB = b.fromDate || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    onChange('events', updatedEvents);
    
    setNewEvent({
      eventType: '',
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = formData.events.filter((_: any, i: number) => i !== index);
    onChange('events', newEvents);
  };

  return (
    <div className={styles.form}>
      {/* Add Event Section */}
      <div className={styles.formSection}>
        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <SearchableSelect
              label="Event Type"
              value={newEvent.eventType}
              onChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
              options={eventTypeOptions}
              placeholder="Search event type..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <DatePicker
              label="From Date & Time"
              value={newEvent.fromDate}
              onChange={(value) => setNewEvent({ ...newEvent, fromDate: value })}
              includeTime={true}
              timeValue={newEvent.fromTime}
              onTimeChange={(value) => setNewEvent({ ...newEvent, fromTime: value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <DatePicker
              label="To Date & Time"
              value={newEvent.toDate}
              onChange={(value) => setNewEvent({ ...newEvent, toDate: value })}
              minDate={newEvent.fromDate}
              includeTime={true}
              timeValue={newEvent.toTime}
              onTimeChange={(value) => setNewEvent({ ...newEvent, toTime: value })}
            />
          </div>
        </div>

        <div className={styles.formRow3Col}>
          <div className={styles.formGroup}>
            <Textarea
              label="Venue"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              placeholder="Enter venue name and address"
              required
              rows={2}
            />
          </div>
          <div className={styles.formGroup}>
            <Input
              label="Location (Map Link)"
              value={newEvent.venueLocation}
              onChange={(e) => setNewEvent({ ...newEvent, venueLocation: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className={styles.formGroup}>
            <MultiSelect
              label="Team Members"
              value={newEvent.teamMembers}
              onChange={(value) => setNewEvent({ ...newEvent, teamMembers: value })}
              options={teamMemberOptions}
              placeholder="Select team members..."
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.addEventButton}
          onClick={handleAddEvent}
          disabled={!newEvent.eventType || !newEvent.fromDate || !newEvent.venue}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>
      </div>

      {/* Events List Section */}
      <div className={styles.formSection} style={{ marginTop: '16px' }}>
        {errors.events && (
          <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {errors.events}
          </div>
        )}
        
        {formData.events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No events added yet. Add your first event above.</p>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {formData.events.map((event: any, index: number) => (
              <EventCard
                key={index}
                event={event}
                index={index}
                teamMemberOptions={teamMemberOptions}
                onRemove={handleRemoveEvent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
