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
      value: String(event.eventId || event._id),
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
    
    // Reset form and close modal
    setIsAddModalOpen(false);
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

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
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

  const handleEditEvent = (index: number) => {
    const eventToEdit = formData.events[index];
    
    setEditingIndex(index);
    setNewEvent({
      eventType: String(eventToEdit.eventId || ''),
      fromDate: eventToEdit.fromDate || '',
      toDate: eventToEdit.toDate || '',
      fromTime: eventToEdit.fromTime || '',
      toTime: eventToEdit.toTime || '',
      venue: eventToEdit.venue || '',
      venueLocation: eventToEdit.venueLocation || '',
      teamMembers: eventToEdit.teamMembers || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = () => {
    if (editingIndex === null) return;
    if (!newEvent.eventType || !newEvent.fromDate || !newEvent.venue) {
      return;
    }

    const updatedEvent = {
      ...formData.events[editingIndex],
      eventId: newEvent.eventType,
      eventName: eventTypeOptions.find(opt => opt.value === newEvent.eventType)?.label || '',
      fromDate: newEvent.fromDate,
      toDate: newEvent.toDate || newEvent.fromDate,
      fromTime: newEvent.fromTime,
      toTime: newEvent.toTime,
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

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsEditModalOpen(false);
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

  return (
    <>
      <div className={styles.form}>
        {/* Add New Event Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
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
          <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {errors.events}
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

          <div className={styles.formGroup}>
            <Textarea
              label="Venue"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              placeholder="Enter venue name and address"
              required
              rows={3}
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
              disabled={!newEvent.eventType || !newEvent.fromDate || !newEvent.venue}
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

            <div className={styles.formGroup}>
              <Textarea
                label="Venue"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                placeholder="Enter venue name and address"
                required
                rows={3}
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
                disabled={!newEvent.eventType || !newEvent.fromDate || !newEvent.venue}
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
