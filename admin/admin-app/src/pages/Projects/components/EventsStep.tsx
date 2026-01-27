import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Modal } from '../../../components/ui/Modal';
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newEvent, setNewEvent] = useState({
    eventType: '',
    fromDate: '',
    fromTime: '',
    duration: 4, // Default 4 hours
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
      value: String(event.eventId || event._id),
      label: event.eventDesc || event.eventCode,
    })) : [])
  ];

  const handleAddEvent = () => {
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!newEvent.eventType) errors.eventType = 'Event type is required';
    if (!newEvent.fromDate) errors.fromDate = 'Date is required';
    if (!newEvent.fromTime) errors.fromTime = 'Time is required';
    if (!newEvent.venue) errors.venue = 'Venue is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Calculate toDate and toTime based on duration
    const fromDateTime = new Date(`${newEvent.fromDate}T${newEvent.fromTime || '00:00'}`);
    const toDateTime = new Date(fromDateTime.getTime() + newEvent.duration * 60 * 60 * 1000);
    
    const toDate = toDateTime.toISOString().split('T')[0];
    const toTime = toDateTime.toTimeString().slice(0, 5);

    const event = {
      eventId: newEvent.eventType, // Use the selected event ID from dropdown
      eventName: eventTypeOptions.find(opt => opt.value === newEvent.eventType)?.label || '',
      fromDate: newEvent.fromDate,
      toDate: toDate,
      fromTime: newEvent.fromTime,
      toTime: toTime,
      duration: newEvent.duration,
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
    
    // Reset form and close modal
    setIsAddModalOpen(false);
    setValidationErrors({});
    setNewEvent({
      eventType: '',
      fromDate: '',
      fromTime: '',
      duration: 4,
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  const handleOpenAddModal = () => {
    setValidationErrors({});
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
    setValidationErrors({});
    setNewEvent({
      eventType: '',
      fromDate: '',
      fromTime: '',
      duration: 4,
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = formData.events.filter((_: any, i: number) => i !== index);
    onChange('events', newEvents);
  };

  const handleEditEvent = (index: number) => {
    const eventToEdit = formData.events[index];
    
    // Calculate duration from existing dates if available
    let duration = eventToEdit.duration || 4;
    if (eventToEdit.fromDate && eventToEdit.toDate && eventToEdit.fromTime && eventToEdit.toTime) {
      const from = new Date(`${eventToEdit.fromDate}T${eventToEdit.fromTime}`);
      const to = new Date(`${eventToEdit.toDate}T${eventToEdit.toTime}`);
      duration = Math.round((to.getTime() - from.getTime()) / (60 * 60 * 1000));
    }
    
    setEditingIndex(index);
    setValidationErrors({});
    setNewEvent({
      eventType: String(eventToEdit.eventId || ''),
      fromDate: eventToEdit.fromDate || '',
      fromTime: eventToEdit.fromTime || '',
      duration: duration,
      venue: eventToEdit.venue || '',
      venueLocation: eventToEdit.venueLocation || '',
      teamMembers: eventToEdit.teamMembers || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = () => {
    if (editingIndex === null) return;
    
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!newEvent.eventType) errors.eventType = 'Event type is required';
    if (!newEvent.fromDate) errors.fromDate = 'Date is required';
    if (!newEvent.fromTime) errors.fromTime = 'Time is required';
    if (!newEvent.venue) errors.venue = 'Venue is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Calculate toDate and toTime based on duration
    const fromDateTime = new Date(`${newEvent.fromDate}T${newEvent.fromTime || '00:00'}`);
    const toDateTime = new Date(fromDateTime.getTime() + newEvent.duration * 60 * 60 * 1000);
    
    const toDate = toDateTime.toISOString().split('T')[0];
    const toTime = toDateTime.toTimeString().slice(0, 5);

    const updatedEvent = {
      ...formData.events[editingIndex],
      eventId: newEvent.eventType,
      eventName: eventTypeOptions.find(opt => opt.value === newEvent.eventType)?.label || '',
      fromDate: newEvent.fromDate,
      toDate: toDate,
      fromTime: newEvent.fromTime,
      toTime: toTime,
      duration: newEvent.duration,
      venue: newEvent.venue,
      venueLocation: newEvent.venueLocation,
      teamMembers: newEvent.teamMembers,
      fromProposal: formData.events[editingIndex].fromProposal, // Preserve the flag
    };

    const updatedEvents = [...formData.events];
    updatedEvents[editingIndex] = updatedEvent;

    // Sort by date
    updatedEvents.sort((a, b) => {
      const dateA = a.fromDate || '';
      const dateB = b.fromDate || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    onChange('events', updatedEvents);
    
    // Reset form and close modal
    setEditingIndex(null);
    setIsEditModalOpen(false);
    setValidationErrors({});
    setNewEvent({
      eventType: '',
      fromDate: '',
      fromTime: '',
      duration: 4,
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsEditModalOpen(false);
    setValidationErrors({});
    setNewEvent({
      eventType: '',
      fromDate: '',
      fromTime: '',
      duration: 4,
      venue: '',
      venueLocation: '',
      teamMembers: [],
    });
  };

  return (
    <>
      <div className={styles.form}>
        {/* Add New Event Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            className={styles.addEventButton}
            onClick={handleOpenAddModal}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Event
          </button>
        </div>

        {/* Validation Error */}
        {errors.events && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>All events must have date and time information. Please edit events from proposal to add date/time.</span>
          </div>
        )}

        {/* Events List Section */}
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
                eventTypeOptions={eventTypeOptions}
                onRemove={handleRemoveEvent}
                onEdit={handleEditEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCancelAdd}
        title="Add New Event"
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.formGroup}>
            <SearchableSelect
              label="Event Type"
              value={newEvent.eventType}
              onChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
              options={eventTypeOptions}
              placeholder="Search event type..."
              info="Select the type of event (e.g., Wedding, Reception, Pre-wedding shoot)"
              error={validationErrors.eventType}
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
              info="Select the start date and time for this event"
              error={validationErrors.fromDate || validationErrors.fromTime}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="Duration (hours)"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={String(newEvent.duration)}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) {
                  setNewEvent({ ...newEvent, duration: 0 });
                } else if (value > 24) {
                  setNewEvent({ ...newEvent, duration: 24 });
                } else if (value < 0) {
                  setNewEvent({ ...newEvent, duration: 0 });
                } else {
                  setNewEvent({ ...newEvent, duration: value });
                }
              }}
              placeholder="Enter duration in hours (max 24)"
              info="Expected duration of the event (0.5 to 24 hours)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <Textarea
              label="Venue"
              value={newEvent.venue}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setNewEvent({ ...newEvent, venue: value });
                }
              }}
              placeholder="Enter venue name and address"
              info="Full venue name and address where the event will take place"
              maxLength={500}
              showCharCount={true}
              error={validationErrors.venue}
              required
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <Input
              label="Location (Map Link)"
              value={newEvent.venueLocation}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setNewEvent({ ...newEvent, venueLocation: value });
                }
              }}
              placeholder="https://maps.google.com/..."
              info="Google Maps or other map service link to the venue location"
              maxLength={500}
              showCharCount={true}
            />
          </div>
          
          <div className={styles.formGroup}>
            <MultiSelect
              label="Team Members"
              value={newEvent.teamMembers}
              onChange={(value) => setNewEvent({ ...newEvent, teamMembers: value })}
              options={teamMemberOptions}
              placeholder="Select team members..."
              info="Select team members who will be working on this event"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelAdd}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.addEventButton}
              onClick={handleAddEvent}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      {editingIndex !== null && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCancelEdit}
          title={`Edit Event: ${formData.events[editingIndex]?.eventName}`}
          size="medium"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.formGroup}>
              <SearchableSelect
                label="Event Type"
                value={newEvent.eventType}
                onChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
                options={eventTypeOptions}
                placeholder="Search event type..."
                info="Select the type of event (e.g., Wedding, Reception, Pre-wedding shoot)"
                error={validationErrors.eventType}
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
                info="Select the start date and time for this event"
                error={validationErrors.fromDate || validationErrors.fromTime}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <Input
                label="Duration (hours)"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={String(newEvent.duration)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value)) {
                    setNewEvent({ ...newEvent, duration: 0 });
                  } else if (value > 24) {
                    setNewEvent({ ...newEvent, duration: 24 });
                  } else if (value < 0) {
                    setNewEvent({ ...newEvent, duration: 0 });
                  } else {
                    setNewEvent({ ...newEvent, duration: value });
                  }
                }}
                placeholder="Enter duration in hours (max 24)"
                info="Expected duration of the event (0.5 to 24 hours)"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <Textarea
                label="Venue"
                value={newEvent.venue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setNewEvent({ ...newEvent, venue: value });
                  }
                }}
                placeholder="Enter venue name and address"
                info="Full venue name and address where the event will take place"
                maxLength={500}
                showCharCount={true}
                error={validationErrors.venue}
                required
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <Input
                label="Location (Map Link)"
                value={newEvent.venueLocation}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setNewEvent({ ...newEvent, venueLocation: value });
                  }
                }}
                placeholder="https://maps.google.com/..."
                info="Google Maps or other map service link to the venue location"
                maxLength={500}
                showCharCount={true}
              />
            </div>
            
            <div className={styles.formGroup}>
              <MultiSelect
                label="Team Members"
                value={newEvent.teamMembers}
                onChange={(value) => setNewEvent({ ...newEvent, teamMembers: value })}
                options={teamMemberOptions}
                placeholder="Select team members..."
                info="Select team members who will be working on this event"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.addEventButton}
                onClick={handleUpdateEvent}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
